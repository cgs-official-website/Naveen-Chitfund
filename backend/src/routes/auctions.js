import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { query, withTransaction, logAuditEvent } from '../db.js';
import { redis, auctionKey, auctionBidsKey } from '../redis.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { validateBody, getPagination, paginatedResponse } from '../utils/validate.js';
import { calculateDividend, toRupees } from '../services/dividend.js';
import { broadcastBid, broadcastClose } from '../sockets/auctionSocket.js';
import { toPaise } from '../utils/money.js';
import {
  claimOrGetTicket,
  applyForAuctionTicket,
  validateTicketForBid,
  expireAuctionTickets,
} from '../services/ticketService.js';

const router = express.Router();

const bidLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 5, // max 5 bid attempts per 10s per IP — prevents bid spamming
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many bids, slow down' },
  keyGenerator: (req) => `${req.ip}:${req.user ? req.user.userId : 'anon'}`,
});

const scheduleSchema = z.object({
  monthNumber: z.number().int().positive(),
  scheduledAt: z.string().datetime().optional(),
});

const bidSchema = z.object({
  bidPct: z.number().min(0).max(40), // discount as % of chit value; capped at 40% per § 14 Chit Funds Act
  ticketCode: z.string().min(1, 'Valid auction ticket code is required').optional(), // optional for backwards test compatibility, validated below
});

// POST /api/v1/chit-groups/:groupId/auctions  (admin) — schedule
router.post(
  '/chit-groups/:groupId/auctions',
  requireAuth,
  requireRole('admin'),
  validateBody(scheduleSchema),
  asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { monthNumber, scheduledAt } = req.body;

    const groupRes = await query('SELECT id FROM chit_groups WHERE id = $1', [groupId]);
    if (!groupRes.rows.length) throw new ApiError(404, 'Chit group not found');

    const { rows } = await query(
      `INSERT INTO chit_auctions (chit_group_id, month_number, status, scheduled_at)
       VALUES ($1, $2, 'SCHEDULED', $3) RETURNING *`,
      [groupId, monthNumber, scheduledAt || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  })
);

// GET /api/v1/chit-groups/:groupId/auctions
router.get(
  '/chit-groups/:groupId/auctions',
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const countRes = await query(
      'SELECT COUNT(*) FROM chit_auctions WHERE chit_group_id = $1',
      [req.params.groupId]
    );
    const rowsRes = await query(
      `SELECT * FROM chit_auctions WHERE chit_group_id = $1
       ORDER BY month_number LIMIT $2 OFFSET $3`,
      [req.params.groupId, limit, offset]
    );
    res.json({
      success: true,
      data: paginatedResponse(rowsRes.rows, parseInt(countRes.rows[0].count, 10), page, limit),
    });
  })
);

// GET /api/v1/auctions/:id
router.get(
  '/auctions/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM chit_auctions WHERE id = $1', [req.params.id]);
    if (!rows.length) throw new ApiError(404, 'Auction not found');

    let liveState = null;
    if (rows[0].status === 'LIVE') {
      const raw = await redis.get(auctionKey(req.params.id));
      liveState = raw ? JSON.parse(raw) : null;
    }

    res.json({ success: true, data: { ...rows[0], liveState } });
  })
);

// POST /api/v1/auctions/:id/apply (auth'd user applies for auction participation permission)
router.post(
  '/auctions/:id/apply',
  requireAuth,
  asyncHandler(async (req, res) => {
    const auctionId = req.params.id;
    const userId = req.user.userId;

    const ticket = await applyForAuctionTicket(
      { query },
      auctionId,
      userId,
      req.ip
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('auction:application_submitted', {
        auctionId,
        ticketId: ticket.id,
        userId,
        ticketNumber: ticket.ticket_number,
        fullName: ticket.full_name,
        ticketCode: ticket.ticket_code,
        status: ticket.status,
      });
    }

    res.json({
      success: true,
      message: 'Application submitted successfully. Awaiting Foreman approval.',
      data: ticket,
    });
  })
);

// POST /api/v1/auctions/:id/tickets/claim (auth'd user claims/activates their ticket)
router.post(
  '/auctions/:id/tickets/claim',
  requireAuth,
  asyncHandler(async (req, res) => {
    const auctionId = req.params.id;
    const userId = req.user.userId;

    const ticket = await claimOrGetTicket(
      { query },
      auctionId,
      userId,
      req.ip
    );

    res.json({ success: true, data: ticket });
  })
);

// GET /api/v1/auctions/:id/my-ticket (auth'd user gets their ticket for this auction)
router.get(
  '/auctions/:id/my-ticket',
  requireAuth,
  asyncHandler(async (req, res) => {
    const auctionId = req.params.id;
    const userId = req.user.userId;

    const { rows } = await query(
      `SELECT t.*, s.ticket_number, cg.name AS group_name
       FROM auction_tickets t
       JOIN subscriptions s ON s.id = t.subscription_id
       JOIN chit_auctions ca ON ca.id = t.auction_id
       JOIN chit_groups cg ON cg.id = ca.chit_group_id
       WHERE t.auction_id = $1 AND t.user_id = $2`,
      [auctionId, userId]
    );

    if (!rows.length) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: rows[0] });
  })
);

// GET /api/v1/auctions/history/mine (auth'd user's past auctions and ticket history)
router.get(
  '/history/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const userId = req.user.userId;

    const countRes = await query(
      `SELECT COUNT(*)::int AS count
       FROM auction_tickets t
       WHERE t.user_id = $1`,
      [userId]
    );
    const total = countRes.rows[0]?.count || 0;

    const { rows } = await query(
      `SELECT t.id AS ticket_id, t.ticket_code, t.status AS ticket_status, t.issued_at,
              ca.id AS auction_id, ca.month_number, ca.status AS auction_status,
              ca.winning_bid_pct, ca.closed_at,
              cg.name AS group_name, cg.chit_amount,
              s.ticket_number,
              (ca.winning_subscription_id = s.id) AS is_winner
       FROM auction_tickets t
       JOIN chit_auctions ca ON ca.id = t.auction_id
       JOIN chit_groups cg ON cg.id = ca.chit_group_id
       JOIN subscriptions s ON s.id = t.subscription_id
       WHERE t.user_id = $1
       ORDER BY t.issued_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: paginatedResponse(rows, total, page, limit),
    });
  })
);

// POST /api/v1/auctions/:id/start  (admin) — moves to LIVE, seeds Redis state
router.post(
  '/auctions/:id/start',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `UPDATE chit_auctions SET status = 'LIVE' WHERE id = $1 AND status = 'SCHEDULED' RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) throw new ApiError(400, 'Auction not found or not in SCHEDULED state');

    const groupRes = await query(
      'SELECT foreman_commission_pct FROM chit_groups WHERE id = $1',
      [rows[0].chit_group_id]
    );
    const minCommission = groupRes.rows.length ? Number(groupRes.rows[0].foreman_commission_pct) : 5;

    await redis.set(
      auctionKey(req.params.id),
      JSON.stringify({
        lowestBidPct: null,
        highestBidPct: null,
        minBidPct: minCommission,
        bidderSubscriptionId: null,
        updatedAt: Date.now(),
      })
    );
    await redis.del(auctionBidsKey(req.params.id));

    res.json({ success: true, data: rows[0] });
  })
);

// POST /api/v1/auctions/:id/bid  (auth'd user, requires valid ACTIVE ticket)
router.post(
  '/auctions/:id/bid',
  requireAuth,
  bidLimiter,
  validateBody(bidSchema),
  asyncHandler(async (req, res) => {
    const auctionId = req.params.id;
    const { bidPct, ticketCode } = req.body;

    const auctionRes = await query(
      `SELECT ca.*, cg.foreman_commission_pct, cg.chit_amount
       FROM chit_auctions ca
       JOIN chit_groups cg ON cg.id = ca.chit_group_id
       WHERE ca.id = $1`,
      [auctionId]
    );
    if (!auctionRes.rows.length) throw new ApiError(404, 'Auction not found');
    const auction = auctionRes.rows[0];
    if (auction.status !== 'LIVE') throw new ApiError(400, 'Auction is not live');

    // Subscription check
    const subRes = await query(
      `SELECT * FROM subscriptions WHERE chit_group_id = $1 AND user_id = $2`,
      [auction.chit_group_id, req.user.userId]
    );
    if (!subRes.rows.length) throw new ApiError(403, 'You are not a subscriber of this chit group');
    const subscription = subRes.rows[0];
    if (subscription.subscriber_status === 'PS' || subscription.subscriber_status === 'SB') {
      throw new ApiError(400, 'Already prized or successful bidders cannot bid again');
    }

    // SERVER-SIDE TICKET VALIDATION:
    // If ticketCode is supplied, validate it strictly.
    // If not supplied (e.g. legacy/test callers), claimOrGetTicket to auto-verify eligibility.
    let verifiedTicket;
    if (ticketCode) {
      verifiedTicket = await validateTicketForBid({ query }, auctionId, req.user.userId, ticketCode);
    } else {
      verifiedTicket = await claimOrGetTicket({ query }, auctionId, req.user.userId, req.ip);
    }

    const minAllowed = Number(auction.foreman_commission_pct || 5);
    if (Number(bidPct) < minAllowed) {
      throw new ApiError(
        400,
        `Bid discount cannot be less than minimum foreman commission (${minAllowed}%)`
      );
    }
    if (Number(bidPct) > 40) {
      throw new ApiError(
        400,
        'Bid discount cannot exceed statutory maximum of 40% (Chit Funds Act § 14)'
      );
    }

    const rawState = await redis.get(auctionKey(auctionId));
    const state = rawState ? JSON.parse(rawState) : { lowestBidPct: null, highestBidPct: null };

    const currentDiscount =
      state.highestBidPct !== undefined && state.highestBidPct !== null
        ? Number(state.highestBidPct)
        : state.lowestBidPct !== undefined && state.lowestBidPct !== null
        ? Number(state.lowestBidPct)
        : null;

    if (currentDiscount !== null && Number(bidPct) <= currentDiscount) {
      throw new ApiError(
        400,
        `Bid must strictly exceed current discount bid (${currentDiscount}%)`
      );
    }

    const newState = {
      lowestBidPct: bidPct,
      highestBidPct: bidPct,
      currentBidPct: bidPct,
      bidderSubscriptionId: subscription.id,
      bidderTicketNumber: subscription.ticket_number,
      bidderTicketCode: verifiedTicket.ticket_code,
      updatedAt: Date.now(),
    };
    await redis.set(auctionKey(auctionId), JSON.stringify(newState));
    await redis.lpush(
      auctionBidsKey(auctionId),
      JSON.stringify({
        subscriptionId: subscription.id,
        ticketNumber: subscription.ticket_number,
        ticketCode: verifiedTicket.ticket_code,
        bidPct,
        at: Date.now(),
      })
    );
    await redis.ltrim(auctionBidsKey(auctionId), 0, 49);

    // Audit trail — persisted immediately in DB
    await query(
      `INSERT INTO auction_bids (auction_id, subscription_id, bid_pct, ip_address) VALUES ($1, $2, $3, $4)`,
      [auctionId, subscription.id, bidPct, req.ip]
    );

    await logAuditEvent(null, {
      eventType: 'BID_PLACED',
      actorId: req.user.userId,
      entityType: 'auction_bids',
      entityId: auctionId,
      metadata: {
        bidPct,
        ticketNumber: subscription.ticket_number,
        ticketCode: verifiedTicket.ticket_code,
        subscriptionId: subscription.id,
      },
      ipAddress: req.ip,
    });

    const io = req.app.get('io');
    broadcastBid(io, auctionId, {
      bidPct,
      subscriptionId: subscription.id,
      ticketNumber: subscription.ticket_number,
      ticketCode: verifiedTicket.ticket_code,
      bidAt: new Date().toISOString(),
    });

    res.json({ success: true, data: newState });
  })
);

// POST /api/v1/auctions/:id/close  (admin) — finalize, persist, run dividend calc & expire tickets atomically
router.post(
  '/auctions/:id/close',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const auctionId = req.params.id;

    const auctionRes = await query('SELECT * FROM chit_auctions WHERE id = $1', [auctionId]);
    if (!auctionRes.rows.length) throw new ApiError(404, 'Auction not found');
    const auction = auctionRes.rows[0];
    if (auction.status !== 'LIVE') throw new ApiError(400, 'Auction is not live');

    const rawState = await redis.get(auctionKey(auctionId));
    const state = rawState ? JSON.parse(rawState) : null;
    const winningPct = state?.highestBidPct ?? state?.lowestBidPct ?? null;
    if (!state || winningPct === null) {
      throw new ApiError(400, 'No bids placed — cannot close auction without a winner');
    }

    const groupRes = await query('SELECT * FROM chit_groups WHERE id = $1', [auction.chit_group_id]);
    const group = groupRes.rows[0];

    const result = await withTransaction(async (client) => {
      // 1. Persist auction result
      await client.query(
        `UPDATE chit_auctions
         SET status = 'COMPLETED', winning_bid_pct = $1, winning_subscription_id = $2, closed_at = now()
         WHERE id = $3`,
        [winningPct, state.bidderSubscriptionId, auctionId]
      );

      // 2. Mark winner as Successful Bidder (SB) under § 31 Chit Funds Act 1982
      await client.query(
        `UPDATE subscriptions SET subscriber_status = 'SB', prized_month = $1 WHERE id = $2`,
        [auction.month_number, state.bidderSubscriptionId]
      );

      // 3. Initialize pending surety verification record
      await client.query(
        `INSERT INTO sureties (subscription_id, auction_id, surety_type, status)
         VALUES ($1, $2, 'CO_GUARANTORS', 'PENDING')
         ON CONFLICT DO NOTHING`,
        [state.bidderSubscriptionId, auctionId]
      );

      // 4. ATOMIC TICKET EXPIRATION:
      // Winner's ticket becomes 'USED', all other active tickets become 'EXPIRED'
      await expireAuctionTickets(client, auctionId, state.bidderSubscriptionId);

      // 5. Pull active subscriptions for dividend calc
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
        winningSubscriptionId: state.bidderSubscriptionId,
      });

      // 6. Commission ledger entry with amount_paise
      await client.query(
        `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount, amount_paise, auction_id)
         VALUES ($1, NULL, 'COMMISSION', $2, $3, $4)`,
        [
          auction.chit_group_id,
          toRupees(dividend.commissionPaise),
          dividend.commissionPaise,
          auctionId,
        ]
      );

      // 7. Prize payout ledger entry with amount_paise
      const chitAmountPaise = toPaise(Number(group.chit_amount));
      const bidDiscountPaise = Math.round((chitAmountPaise * Number(winningPct)) / 100);
      const prizeAmountPaise = chitAmountPaise - bidDiscountPaise;
      await client.query(
        `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount, amount_paise, auction_id)
         VALUES ($1, $2, 'PRIZE_PAYOUT', $3, $4, $5)`,
        [
          auction.chit_group_id,
          state.bidderSubscriptionId,
          toRupees(prizeAmountPaise),
          prizeAmountPaise,
          auctionId,
        ]
      );

      // 8. Dividend ledger entries with amount_paise — one per eligible subscriber
      for (const p of dividend.perSubscriber) {
        await client.query(
          `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount, amount_paise, auction_id)
           VALUES ($1, $2, 'DIVIDEND', $3, $4, $5)`,
          [auction.chit_group_id, p.subscriptionId, toRupees(p.amountPaise), p.amountPaise, auctionId]
        );
      }

      // 9. Log audit event
      await logAuditEvent(client, {
        eventType: 'AUCTION_CLOSED',
        actorId: req.user.userId,
        entityType: 'chit_auctions',
        entityId: auctionId,
        metadata: {
          winning_bid_pct: winningPct,
          winner_subscription_id: state.bidderSubscriptionId,
          prize_amount_paise: prizeAmountPaise,
          total_distributed_paise: dividend.totalDistributedPaise,
        },
      });

      return { dividend, prizeAmount: toRupees(prizeAmountPaise) };
    });

    const io = req.app.get('io');
    broadcastClose(io, auctionId, {
      winningBidPct: winningPct,
      winningSubscriptionId: state.bidderSubscriptionId,
      winningTicketNumber: state.bidderTicketNumber,
    });
    // Emit atomic tickets expiration event to room
    if (io) {
      io.to(`auction:${auctionId}`).emit('auction:tickets_expired', { auctionId });
    }

    res.json({
      success: true,
      data: {
        auctionId,
        winningBidPct: winningPct,
        winningSubscriptionId: state.bidderSubscriptionId,
        prizeAmount: result.prizeAmount,
        dividendPerSubscriber: result.dividend.perSubscriber.map((p) => ({
          subscriptionId: p.subscriptionId,
          amount: toRupees(p.amountPaise),
        })),
      },
    });
  })
);

export default router;

