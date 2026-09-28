import express from 'express';
import { z } from 'zod';
import { query, withTransaction, logAuditEvent } from '../../db.js';
import { redis, auctionKey, auctionBidsKey } from '../../redis.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';
import { requireSuperAdmin } from '../../middleware/superadminAuth.js';
import { validateBody, getPagination } from '../../utils/validate.js';
import { calculateDividend, toRupees } from '../../services/dividend.js';
import { broadcastClose } from '../../sockets/auctionSocket.js';
import { toPaise } from '../../utils/money.js';

const router = express.Router();

const forceCloseSchema = z.object({
  reason: z.string().min(5, 'Mandatory reason of at least 5 characters required to force-close auction'),
});

// GET /api/v1/superadmin/auctions
router.get(
  '/',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const status = req.query.status || null;
    const groupId = req.query.groupId || null;

    let whereConditions = [];
    const params = [];

    if (status) {
      params.push(status);
      whereConditions.push(`ca.status = $${params.length}`);
    }
    if (groupId) {
      params.push(groupId);
      whereConditions.push(`ca.chit_group_id = $${params.length}`);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*)::int AS total FROM chit_auctions ca ${whereClause}`, params);
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const { rows } = await query(
      `SELECT ca.*,
              cg.name AS group_name,
              cg.chit_amount,
              cg.duration_months,
              u.full_name AS winner_name,
              s.ticket_number AS winner_ticket_number
       FROM chit_auctions ca
       JOIN chit_groups cg ON cg.id = ca.chit_group_id
       LEFT JOIN subscriptions s ON s.id = ca.winning_subscription_id
       LEFT JOIN users u ON u.id = s.user_id
       ${whereClause}
       ORDER BY ca.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    res.json({
      success: true,
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  })
);

// GET /api/v1/superadmin/auctions/:id/bids
router.get(
  '/:id/bids',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const auctionRes = await query(
      `SELECT ca.*, cg.name AS group_name, cg.chit_amount, cg.foreman_commission_pct
       FROM chit_auctions ca
       JOIN chit_groups cg ON cg.id = ca.chit_group_id
       WHERE ca.id = $1`,
      [id]
    );
    if (!auctionRes.rows.length) throw new ApiError(404, 'Auction not found');
    const auction = auctionRes.rows[0];

    // Live redis state
    const rawState = await redis.get(auctionKey(id));
    const liveState = rawState ? JSON.parse(rawState) : null;

    // Database bids audit trail
    const bidsRes = await query(
      `SELECT b.*, s.ticket_number, u.full_name AS bidder_name
       FROM auction_bids b
       JOIN subscriptions s ON s.id = b.subscription_id
       JOIN users u ON u.id = s.user_id
       WHERE b.auction_id = $1
       ORDER BY b.bid_pct DESC, b.created_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        auction,
        liveState,
        bids: bidsRes.rows,
      },
    });
  })
);

// POST /api/v1/superadmin/auctions/:id/force-close
router.post(
  '/:id/force-close',
  requireSuperAdmin,
  validateBody(forceCloseSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const auctionRes = await query('SELECT * FROM chit_auctions WHERE id = $1', [id]);
    if (!auctionRes.rows.length) throw new ApiError(404, 'Auction not found');
    const auction = auctionRes.rows[0];

    if (auction.status === 'COMPLETED') {
      throw new ApiError(400, 'Auction is already completed');
    }

    const groupRes = await query('SELECT * FROM chit_groups WHERE id = $1', [auction.chit_group_id]);
    const group = groupRes.rows[0];

    // Check Redis state or highest bid in DB
    const rawState = await redis.get(auctionKey(id));
    const state = rawState ? JSON.parse(rawState) : null;
    let winningPct = state?.highestBidPct ?? state?.lowestBidPct ?? null;
    let winningSubId = state?.bidderSubscriptionId || null;
    let winningTicket = state?.bidderTicketNumber || null;

    // If no bids placed in Redis, check DB
    if (!winningPct) {
      const topBidRes = await query(
        `SELECT b.*, s.ticket_number
         FROM auction_bids b
         JOIN subscriptions s ON s.id = b.subscription_id
         WHERE b.auction_id = $1
         ORDER BY b.bid_pct DESC, b.created_at ASC LIMIT 1`,
        [id]
      );
      if (topBidRes.rows.length) {
        winningPct = Number(topBidRes.rows[0].bid_pct);
        winningSubId = topBidRes.rows[0].subscription_id;
        winningTicket = topBidRes.rows[0].ticket_number;
      }
    }

    // Default to minimum foreman commission if no bids placed
    if (!winningPct || !winningSubId) {
      // Pick first eligible NPS subscriber as proxy winner if forced
      const subRes = await query(
        `SELECT id, ticket_number FROM subscriptions
         WHERE chit_group_id = $1 AND subscriber_status = 'NPS'
         ORDER BY ticket_number ASC LIMIT 1`,
        [auction.chit_group_id]
      );
      if (!subRes.rows.length) {
        throw new ApiError(400, 'Cannot close auction: no eligible subscribers found in group');
      }
      winningPct = Number(group.foreman_commission_pct || 5);
      winningSubId = subRes.rows[0].id;
      winningTicket = subRes.rows[0].ticket_number;
    }

    const result = await withTransaction(async (client) => {
      // 1. Update auction
      await client.query(
        `UPDATE chit_auctions
         SET status = 'COMPLETED', winning_bid_pct = $1, winning_subscription_id = $2, closed_at = now()
         WHERE id = $3`,
        [winningPct, winningSubId, id]
      );

      // 2. Mark winner as Successful Bidder (SB)
      await client.query(
        `UPDATE subscriptions SET subscriber_status = 'SB', prized_month = $1 WHERE id = $2`,
        [auction.month_number, winningSubId]
      );

      // 3. Initialize surety
      await client.query(
        `INSERT INTO sureties (subscription_id, auction_id, surety_type, status)
         VALUES ($1, $2, 'CO_GUARANTORS', 'PENDING')
         ON CONFLICT DO NOTHING`,
        [winningSubId, id]
      );

      // 4. Calculate dividend
      const subsRes = await client.query(
        `SELECT id AS subscription_id, ticket_number, subscriber_status
         FROM subscriptions WHERE chit_group_id = $1`,
        [auction.chit_group_id]
      );
      const subscriptions = subsRes.rows.map((r) => ({
        subscriptionId: r.subscription_id,
        ticketNumber: r.ticket_number,
        subscriberStatus: r.subscriber_status,
      }));

      const dividend = calculateDividend({
        chitAmount: group.chit_amount,
        winningBidPct: winningPct,
        foremanCommissionPct: group.foreman_commission_pct,
        policy: group.dividend_distribution_policy,
        subscriptions,
        winningSubscriptionId: winningSubId,
      });

      // 5. Commission ledger
      await client.query(
        `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount, amount_paise, auction_id)
         VALUES ($1, NULL, 'COMMISSION', $2, $3, $4)`,
        [auction.chit_group_id, toRupees(dividend.commissionPaise), dividend.commissionPaise, id]
      );

      // 6. Prize payout ledger
      const chitAmountPaise = toPaise(Number(group.chit_amount));
      const bidDiscountPaise = Math.round((chitAmountPaise * Number(winningPct)) / 100);
      const prizeAmountPaise = chitAmountPaise - bidDiscountPaise;

      await client.query(
        `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount, amount_paise, auction_id)
         VALUES ($1, $2, 'PRIZE_PAYOUT', $3, $4, $5)`,
        [auction.chit_group_id, winningSubId, toRupees(prizeAmountPaise), prizeAmountPaise, id]
      );

      // 7. Dividend ledger entries
      for (const p of dividend.perSubscriber) {
        await client.query(
          `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount, amount_paise, auction_id)
           VALUES ($1, $2, 'DIVIDEND', $3, $4, $5)`,
          [auction.chit_group_id, p.subscriptionId, toRupees(p.amountPaise), p.amountPaise, id]
        );
      }

      // 8. Audit log
      await logAuditEvent(client, {
        eventType: 'AUCTION_FORCE_CLOSED',
        actorId: req.superAdmin.id,
        actorType: 'SUPERADMIN',
        entityType: 'chit_auctions',
        entityId: id,
        metadata: {
          reason,
          winning_bid_pct: winningPct,
          winner_subscription_id: winningSubId,
          forced_by: req.superAdmin.email,
        },
        ipAddress: req.ip,
      });

      return { dividend, prizeAmount: toRupees(prizeAmountPaise) };
    });

    const io = req.app.get('io');
    if (io) {
      broadcastClose(io, id, {
        winningBidPct: winningPct,
        winningSubscriptionId: winningSubId,
        winningTicketNumber: winningTicket,
        forceClosed: true,
        reason,
      });
    }

    res.json({
      success: true,
      data: {
        auctionId: id,
        status: 'COMPLETED',
        winningBidPct: winningPct,
        winnerSubscriptionId: winningSubId,
        reason,
      },
    });
  })
);

export default router;
