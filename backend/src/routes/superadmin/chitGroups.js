import express from 'express';
import { z } from 'zod';
import { query, logAuditEvent } from '../../db.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';
import { requireSuperAdmin } from '../../middleware/superadminAuth.js';
import { getPagination, validateBody } from '../../utils/validate.js';
import { toPaise } from '../../utils/money.js';

const router = express.Router();

const createChitGroupSchema = z.object({
  name: z.string().min(3, 'Group name must be at least 3 characters'),
  chitAmount: z.number().positive('Chit amount must be positive'),
  durationMonths: z.number().int().min(2, 'Duration must be at least 2 months').max(120),
  foremanCommissionPct: z.number().min(0).max(20).default(5),
  registrarStateCode: z.string().optional().default('TN'),
  dividendDistributionPolicy: z.enum(['ALL_SUBSCRIBERS', 'NON_PRIZED_ONLY']).default('NON_PRIZED_ONLY'),
  psoNumber: z.string().optional(),
  fdrNumber: z.string().optional(),
});

// POST /api/v1/superadmin/chit-groups
router.post(
  '/',
  requireSuperAdmin,
  validateBody(createChitGroupSchema),
  asyncHandler(async (req, res) => {
    const b = req.body;
    const chitAmountPaise = toPaise(b.chitAmount);

    let newGroup;
    try {
      const { rows } = await query(
        `INSERT INTO chit_groups
           (name, chit_amount, chit_amount_paise, duration_months, foreman_commission_pct, registrar_state_code, dividend_distribution_policy, status, pso_number, fdr_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN', $8, $9)
         RETURNING *`,
        [
          b.name,
          b.chitAmount,
          chitAmountPaise,
          b.durationMonths,
          b.foremanCommissionPct,
          b.registrarStateCode || 'TN',
          b.dividendDistributionPolicy,
          b.psoNumber || null,
          b.fdrNumber || null,
        ]
      );
      newGroup = rows[0];
    } catch (insertErr) {
      // If pso_number or fdr_number column doesn't exist yet, fallback gracefully
      const { rows } = await query(
        `INSERT INTO chit_groups
           (name, chit_amount, chit_amount_paise, duration_months, foreman_commission_pct, registrar_state_code, dividend_distribution_policy, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN')
         RETURNING *`,
        [
          b.name,
          b.chitAmount,
          chitAmountPaise,
          b.durationMonths,
          b.foremanCommissionPct,
          b.registrarStateCode || 'TN',
          b.dividendDistributionPolicy,
        ]
      );
      newGroup = rows[0];
    }

    try {
      await logAuditEvent(null, {
        eventType: 'CHIT_GROUP_CREATED',
        actorId: req.superAdmin?.id || null,
        actorType: 'SUPERADMIN',
        entityType: 'chit_groups',
        entityId: newGroup.id,
        metadata: { name: b.name, chitAmount: b.chitAmount, durationMonths: b.durationMonths },
        ipAddress: req.ip,
      });
    } catch (auditErr) {
      // Non-blocking audit log warning
      console.warn('Audit event log warning:', auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Chit Group created successfully',
      data: newGroup,
    });
  })
);

// GET /api/v1/superadmin/chit-groups
router.get(
  '/',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const q = req.query.q ? `%${req.query.q.trim()}%` : null;
    const status = req.query.status || null;

    let whereConditions = [];
    const params = [];

    if (q) {
      params.push(q);
      whereConditions.push(`cg.name ILIKE $${params.length}`);
    }
    if (status) {
      params.push(status);
      whereConditions.push(`cg.status = $${params.length}`);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*)::int AS total FROM chit_groups cg ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const { rows } = await query(
      `SELECT cg.*,
              COUNT(s.id)::int AS filled_subscribers
       FROM chit_groups cg
       LEFT JOIN subscriptions s ON s.chit_group_id = cg.id
       ${whereClause}
       GROUP BY cg.id
       ORDER BY cg.created_at DESC
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

// GET /api/v1/superadmin/chit-groups/:id
router.get(
  '/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const groupRes = await query(`SELECT * FROM chit_groups WHERE id = $1`, [id]);
    if (!groupRes.rows.length) {
      throw new ApiError(404, 'Chit group not found');
    }
    const group = groupRes.rows[0];

    // Members / Subscriptions
    const membersRes = await query(
      `SELECT s.*, u.full_name, u.phone, u.kyc_status
       FROM subscriptions s
       JOIN users u ON u.id = s.user_id
       WHERE s.chit_group_id = $1
       ORDER BY s.ticket_number ASC`,
      [id]
    );

    // Auctions
    const auctionsRes = await query(
      `SELECT ca.*,
              u.full_name AS winner_name,
              s.ticket_number AS winner_ticket_number
       FROM chit_auctions ca
       LEFT JOIN subscriptions s ON s.id = ca.winning_subscription_id
       LEFT JOIN users u ON u.id = s.user_id
       WHERE ca.chit_group_id = $1
       ORDER BY ca.month_number ASC`,
      [id]
    );

    // Ledger Entries
    const ledgerRes = await query(
      `SELECT l.*, s.ticket_number, u.full_name as subscriber_name
       FROM ledger_entries l
       LEFT JOIN subscriptions s ON s.id = l.subscription_id
       LEFT JOIN users u ON u.id = s.user_id
       WHERE l.chit_group_id = $1
       ORDER BY l.created_at DESC LIMIT 50`,
      [id]
    );

    res.json({
      success: true,
      data: {
        group,
        members: membersRes.rows,
        auctions: auctionsRes.rows,
        ledger: ledgerRes.rows,
      },
    });
  })
);

export default router;
