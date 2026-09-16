import express from 'express';
import { query, withTransaction } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

// Two separate routers so each can be mounted under the correct URL prefix
// without accidentally exposing routes under the wrong path.
const joinRouter = express.Router();
const router = express.Router();

// POST /api/v1/chit-groups/:groupId/join  (auth'd user)
joinRouter.post(
  '/:groupId/join',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const result = await withTransaction(async (client) => {
      const groupRes = await client.query('SELECT * FROM chit_groups WHERE id = $1 FOR UPDATE', [
        groupId,
      ]);
      if (!groupRes.rows.length) throw new ApiError(404, 'Chit group not found');
      const group = groupRes.rows[0];

      if (group.status !== 'OPEN') {
        throw new ApiError(400, 'Chit group is not open for new subscribers');
      }

      // Check current subscriber count against group duration capacity
      const countRes = await client.query(
        'SELECT COUNT(*)::int AS count FROM subscriptions WHERE chit_group_id = $1',
        [groupId]
      );
      if (countRes.rows[0].count >= group.duration_months) {
        throw new ApiError(400, 'Chit group is already at full capacity');
      }

      const existing = await client.query(
        'SELECT id FROM subscriptions WHERE chit_group_id = $1 AND user_id = $2',
        [groupId, req.user.userId]
      );
      if (existing.rows.length) {
        throw new ApiError(409, 'Already joined this chit group');
      }

      const ticketRes = await client.query(
        'SELECT COALESCE(MAX(ticket_number), 0) + 1 AS next_ticket FROM subscriptions WHERE chit_group_id = $1',
        [groupId]
      );
      const ticketNumber = ticketRes.rows[0].next_ticket;

      const subRes = await client.query(
        `INSERT INTO subscriptions (chit_group_id, user_id, ticket_number, subscriber_status)
         VALUES ($1, $2, $3, 'NPS') RETURNING *`,
        [groupId, req.user.userId, ticketNumber]
      );
      const subscription = subRes.rows[0];

      // Auto-generate installment schedule: chit_amount / duration_months per month.
      const installmentAmount = (Number(group.chit_amount) / group.duration_months).toFixed(2);
      const installmentPaise = Math.round((Number(group.chit_amount) / group.duration_months) * 100);
      for (let month = 1; month <= group.duration_months; month += 1) {
        await client.query(
          `INSERT INTO installments (subscription_id, month_number, amount_due, amount_due_paise, status)
           VALUES ($1, $2, $3, $4, 'PENDING')`,
          [subscription.id, month, installmentAmount, installmentPaise]
        );
      }

      // If group reached full subscriber capacity, transition status to RUNNING
      if (ticketNumber >= group.duration_months) {
        await client.query(`UPDATE chit_groups SET status = 'RUNNING' WHERE id = $1`, [groupId]);
      }

      return {
        ...subscription,
        chit_group_name: group.name,
        chit_amount: Number(group.chit_amount),
        duration_months: group.duration_months,
        installment_amount: Number(installmentAmount),
      };
    });

    res.status(201).json({ success: true, data: result });
  })
);

// GET /api/v1/subscriptions/mine  (auth'd user's own subscriptions + status)
router.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT s.id, s.chit_group_id, s.user_id, s.ticket_number, s.subscriber_status, s.prized_month, s.joined_at,
              cg.name AS group_name,
              cg.name AS chit_group_name,
              cg.chit_amount::float AS chit_amount,
              cg.duration_months,
              cg.duration_months AS total_installments,
              cg.status AS group_status,
              ROUND(cg.chit_amount / cg.duration_months, 2)::float AS installment_amount,
              COALESCE((SELECT COUNT(*)::int FROM installments i WHERE i.subscription_id = s.id AND i.status = 'PAID'), 0) AS installments_paid,
              COALESCE((SELECT SUM(amount)::float FROM ledger_entries le WHERE le.subscription_id = s.id AND le.entry_type = 'DIVIDEND'), 0) AS total_dividend_earned
       FROM subscriptions s
       JOIN chit_groups cg ON cg.id = s.chit_group_id
       WHERE s.user_id = $1
       ORDER BY s.joined_at DESC`,
      [req.user.userId]
    );
    res.json({ success: true, data: rows });
  })
);

// GET /api/v1/subscriptions/:id/installments  (owner or admin)
router.get(
  '/:id/installments',
  requireAuth,
  asyncHandler(async (req, res) => {
    const subRes = await query('SELECT * FROM subscriptions WHERE id = $1', [req.params.id]);
    if (!subRes.rows.length) throw new ApiError(404, 'Subscription not found');
    const sub = subRes.rows[0];

    if (sub.user_id !== req.user.userId && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized to view this subscription');
    }

    const { rows } = await query(
      'SELECT * FROM installments WHERE subscription_id = $1 ORDER BY month_number',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  })
);

// GET /api/v1/subscriptions/:id/dividends  (owner or admin) — dividend/prize ledger history
router.get(
  '/:id/dividends',
  requireAuth,
  asyncHandler(async (req, res) => {
    const subRes = await query('SELECT * FROM subscriptions WHERE id = $1', [req.params.id]);
    if (!subRes.rows.length) throw new ApiError(404, 'Subscription not found');
    const sub = subRes.rows[0];

    if (sub.user_id !== req.user.userId && req.user.role !== 'admin') {
      throw new ApiError(403, 'Not authorized to view this subscription');
    }

    const { rows } = await query(
      `SELECT * FROM ledger_entries
       WHERE subscription_id = $1 AND entry_type IN ('DIVIDEND', 'PRIZE_PAYOUT')
       ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  })
);

export { router, joinRouter };
