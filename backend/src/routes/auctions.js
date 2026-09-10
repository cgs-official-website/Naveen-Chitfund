const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { query, withTransaction } = require('../db');
const { redis, auctionKey, auctionBidsKey } = require('../redis');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { validateBody, getPagination, paginatedResponse } = require('../utils/validate');
const { calculateDividend, toRupees } = require('../services/dividend');
const { broadcastBid, broadcastClose } = require('../sockets/auctionSocket');

const router = express.Router();

const bidLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 5, // max 5 bid attempts per 10s per IP — prevents bid spamming
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
  bidPct: z.number().min(0).max(50), // discount as % of chit value; sane upper bound
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

    await redis.set(
      auctionKey(req.params.id),
      JSON.stringify({ lowestBidPct: null, bidderSubscriptionId: null, updatedAt: Date.now() })
    );
    await redis.del(auctionBidsKey(req.params.id));

    res.json({ success: true, data: rows[0] });
  })
);

// POST /api/v1/auctions/:id/bid  (auth'd user, own subscription only)
// A chit auction is a reverse auction: the LOWEST bid % (largest discount subscriber
// is willing to forgo) wins, since bidders are competing for early payout.
router.post(
  '/auctions/:id/bid',
  requireAuth,
  bidLimiter,
  validateBody(bidSchema),
  asyncHandler(async (req, res) => {
    const auctionId = req.params.id;
    const { bidPct } = req.body;

    const auctionRes = await query('SELECT * FROM chit_auctions WHERE id = $1', [auctionId]);
    if (!auctionRes.rows.length) throw new ApiError(404, 'Auction not found');
    const auction = auctionRes.rows[0];
    if (auction.status !== 'LIVE') throw new ApiError(400, 'Auction is not live');

    const subRes = await query(
      `SELECT * FROM subscriptions WHERE chit_group_id = $1 AND user_id = $2`,
      [auction.chit_group_id, req.user.userId]
    );
    if (!subRes.rows.length) throw new ApiError(403, 'You are not a subscriber of this chit group');
    const subscription = subRes.rows[0];
    if (subscription.subscriber_status === 'PS') {
      throw new ApiError(400, 'Already-prized subscribers cannot bid again');
    }

    const rawState = await redis.get(auctionKey(auctionId));
    const state = rawState ? JSON.parse(rawState) : { lowestBidPct: null };

    if (state.lowestBidPct !== null && Number(bidPct) >= Number(state.lowestBidPct)) {
      throw new ApiError(400, `Bid must be lower than current lowest bid (${state.lowestBidPct}%)`);
    }

    const newState = {
      lowestBidPct: bidPct,
      bidderSubscriptionId: subscription.id,
      bidderTicketNumber: subscription.ticket_number,
      updatedAt: Date.now(),
    };
    await redis.set(auctionKey(auctionId), JSON.stringify(newState));
    await redis.lpush(
      auctionBidsKey(auctionId),
      JSON.stringify({ subscriptionId: subscription.id, ticketNumber: subscription.ticket_number, bidPct, at: Date.now() })
    );
    await redis.ltrim(auctionBidsKey(auctionId), 0, 49); // keep last 50 for recent-bids feed

    // Audit trail — persisted immediately, independent of auction close.
    await query(
      `INSERT INTO auction_bids (auction_id, subscription_id, bid_pct, ip_address) VALUES ($1, $2, $3, $4)`,
      [auctionId, subscription.id, bidPct, req.ip]
    );
    console.log(`[AUDIT] bid placed: auction=${auctionId} subscription=${subscription.id} bidPct=${bidPct} ip=${req.ip}`);

    const io = req.app.get('io');
    broadcastBid(io, auctionId, {
      bidPct,
      subscriptionId: subscription.id,
      ticketNumber: subscription.ticket_number,
      bidAt: new Date().toISOString(),
    });

    res.json({ success: true, data: newState });
  })
);

// POST /api/v1/auctions/:id/close  (admin) — finalize, persist, run dividend calc
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
    if (!state || state.lowestBidPct === null) {
      throw new ApiError(400, 'No bids placed — cannot close auction without a winner');
    }

    const groupRes = await query('SELECT * FROM chit_groups WHERE id = $1', [auction.chit_group_id]);
    const group = groupRes.rows[0];

    const result = await withTransaction(async (client) => {
      // Persist auction result
      await client.query(
        `UPDATE chit_auctions
         SET status = 'COMPLETED', winning_bid_pct = $1, winning_subscription_id = $2, closed_at = now()
         WHERE id = $3`,
        [state.lowestBidPct, state.bidderSubscriptionId, auctionId]
      );

      // Mark winner as prized subscriber (PS)
      await client.query(
        `UPDATE subscriptions SET subscriber_status = 'PS', prized_month = $1 WHERE id = $2`,
        [auction.month_number, state.bidderSubscriptionId]
      );

      // Pull ALL active subscriptions for this group, post-update, for dividend calc
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
        winningBidPct: state.lowestBidPct,
        foremanCommissionPct: group.foreman_commission_pct,
        policy: group.dividend_distribution_policy,
        subscriptions,
        winningSubscriptionId: state.bidderSubscriptionId,
      });

      // Commission ledger entry
      await client.query(
        `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount, auction_id)
         VALUES ($1, NULL, 'COMMISSION', $2, $3)`,
        [auction.chit_group_id, toRupees(dividend.commissionPaise), auctionId]
      );

      // Prize payout ledger entry (chit amount minus their own discount, simplified as chit_amount - bid_discount)
      const chitAmountPaise = Math.round(Number(group.chit_amount) * 100);
      const bidDiscountPaise = Math.round((chitAmountPaise * Number(state.lowestBidPct)) / 100);
      const prizeAmountPaise = chitAmountPaise - bidDiscountPaise;
      await client.query(
        `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount, auction_id)
         VALUES ($1, $2, 'PRIZE_PAYOUT', $3, $4)`,
        [auction.chit_group_id, state.bidderSubscriptionId, toRupees(prizeAmountPaise), auctionId]
      );

      // Dividend ledger entries — one per eligible subscriber
      for (const p of dividend.perSubscriber) {
        await client.query(
          `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount, auction_id)
           VALUES ($1, $2, 'DIVIDEND', $3, $4)`,
          [auction.chit_group_id, p.subscriptionId, toRupees(p.amountPaise), auctionId]
        );
      }

      console.log(
        `[AUDIT] auction closed: auction=${auctionId} winner=${state.bidderSubscriptionId} bidPct=${state.lowestBidPct} ` +
          `distributed=${toRupees(dividend.totalDistributedPaise)} commission=${toRupees(dividend.commissionPaise)}`
      );

      return { dividend, prizeAmount: toRupees(prizeAmountPaise) };
    });

    const io = req.app.get('io');
    broadcastClose(io, auctionId, {
      winningBidPct: state.lowestBidPct,
      winningSubscriptionId: state.bidderSubscriptionId,
      winningTicketNumber: state.bidderTicketNumber,
    });

    res.json({
      success: true,
      data: {
        auctionId,
        winningBidPct: state.lowestBidPct,
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

module.exports = router;
