import express from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { validateBody, getPagination, paginatedResponse } from '../utils/validate.js';
import { toPaise } from '../utils/money.js';

const router = express.Router();

const createGroupSchema = z.object({
  name: z.string().min(3),
  chitAmount: z.number().positive(),
  durationMonths: z.number().int().positive(),
  foremanCommissionPct: z.number().min(0).max(20).default(5),
  registrarStateCode: z.string().optional(),
  dividendDistributionPolicy: z.enum(['ALL_SUBSCRIBERS', 'NON_PRIZED_ONLY']).default('NON_PRIZED_ONLY'),
});

// GET /api/v1/chit-groups  (public read, paginated, filterable by status)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const { status } = req.query;

    const where = status ? 'WHERE cg.status = $1' : '';
    const params = status ? [status] : [];

    const countRes = await query(`SELECT COUNT(*) FROM chit_groups cg ${where}`, params);
    const rowsRes = await query(
      `SELECT cg.id, cg.name, cg.chit_amount::float AS chit_amount, cg.chit_amount_paise,
              cg.duration_months, cg.foreman_commission_pct::float AS foreman_commission_pct,
              cg.status, cg.registrar_state_code, cg.dividend_distribution_policy,
              cg.created_at,
              COUNT(s.id)::int AS subscriber_count,
              GREATEST(cg.duration_months - COUNT(s.id)::int, 0) AS vacant_slots,
              ROUND(cg.chit_amount / cg.duration_months, 2)::float AS installment_amount
       FROM chit_groups cg
       LEFT JOIN subscriptions s ON s.chit_group_id = cg.id
       ${where}
       GROUP BY cg.id
       ORDER BY cg.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: paginatedResponse(rowsRes.rows, parseInt(countRes.rows[0].count, 10), page, limit),
    });
  })
);

// GET /api/v1/chit-groups/:id  (public read)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT cg.id, cg.name, cg.chit_amount::float AS chit_amount, cg.chit_amount_paise,
              cg.duration_months, cg.foreman_commission_pct::float AS foreman_commission_pct,
              cg.status, cg.registrar_state_code, cg.dividend_distribution_policy,
              cg.created_at,
              COUNT(s.id)::int AS subscriber_count,
              GREATEST(cg.duration_months - COUNT(s.id)::int, 0) AS vacant_slots,
              ROUND(cg.chit_amount / cg.duration_months, 2)::float AS installment_amount
       FROM chit_groups cg
       LEFT JOIN subscriptions s ON s.chit_group_id = cg.id
       WHERE cg.id = $1
       GROUP BY cg.id`,
      [req.params.id]
    );
    if (!rows.length) throw new ApiError(404, 'Chit group not found');

    const subs = await query(
      `SELECT s.id, s.ticket_number, s.subscriber_status, u.full_name AS subscriber_name
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE s.chit_group_id = $1
       ORDER BY s.ticket_number`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...rows[0], subscriptions: subs.rows } });
  })
);

// POST /api/v1/chit-groups  (admin only)
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validateBody(createGroupSchema),
  asyncHandler(async (req, res) => {
    const b = req.body;
    const chitAmountPaise = toPaise(b.chitAmount);
    const { rows } = await query(
      `INSERT INTO chit_groups
         (name, chit_amount, chit_amount_paise, duration_months, foreman_commission_pct, registrar_state_code, dividend_distribution_policy, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN') RETURNING *`,
      [
        b.name,
        b.chitAmount,
        chitAmountPaise,
        b.durationMonths,
        b.foremanCommissionPct,
        b.registrarStateCode || null,
        b.dividendDistributionPolicy,
      ]
    );
    res.status(201).json({ success: true, data: rows[0] });
  })
);

// POST /api/v1/chit-groups/:id/close  (admin only)
router.post(
  '/:id/close',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `UPDATE chit_groups SET status = 'CLOSED' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) throw new ApiError(404, 'Chit group not found');
    res.json({ success: true, data: rows[0] });
  })
);

export default router;
