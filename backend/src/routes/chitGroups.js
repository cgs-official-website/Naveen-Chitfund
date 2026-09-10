const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { validateBody, getPagination, paginatedResponse } = require('../utils/validate');

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

    const where = status ? 'WHERE status = $1' : '';
    const params = status ? [status] : [];

    const countRes = await query(`SELECT COUNT(*) FROM chit_groups ${where}`, params);
    const rowsRes = await query(
      `SELECT cg.*, COUNT(s.id) AS subscriber_count
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
    const { rows } = await query('SELECT * FROM chit_groups WHERE id = $1', [req.params.id]);
    if (!rows.length) throw new ApiError(404, 'Chit group not found');

    const subs = await query(
      `SELECT id, ticket_number, subscriber_status FROM subscriptions WHERE chit_group_id = $1 ORDER BY ticket_number`,
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
    const { rows } = await query(
      `INSERT INTO chit_groups
         (name, chit_amount, duration_months, foreman_commission_pct, registrar_state_code, dividend_distribution_policy, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'OPEN') RETURNING *`,
      [
        b.name,
        b.chitAmount,
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

module.exports = router;
