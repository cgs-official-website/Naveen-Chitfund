import express from 'express';
import { z } from 'zod';
import { query, logAuditEvent } from '../../db.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';
import { requireSuperAdmin } from '../../middleware/superadminAuth.js';
import { validateBody, getPagination } from '../../utils/validate.js';

const router = express.Router();

// Normalise an Indian mobile number to the canonical "+91XXXXXXXXXX" form.
// Accepts: 9876543210, 09876543210, 919876543210, +919876543210 (spaces/dashes ignored).
// Returns null when the value is not a valid 10-digit mobile number.
// The mobile app also logs in with "+91XXXXXXXXXX", so storing this exact form
// keeps a foreman created here matched to the same account when they log in.
const normalizeIndianMobile = (raw) => {
  const cleaned = String(raw ?? '').replace(/[\s\-()]/g, '');
  const match = cleaned.match(/^(?:\+91|91|0)?([0-9]{10})$/);
  return match ? `+91${match[1]}` : null;
};

const createForemanSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100, 'Full name is too long'),
  phone: z
    .string()
    .transform((value) => normalizeIndianMobile(value))
    .refine((value) => value !== null, 'Enter a valid 10-digit mobile number'),
});

const patchForemanSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  reason: z.string().min(5, 'Reason for status update is mandatory'),
});

// GET /api/v1/superadmin/foremen
router.get(
  '/',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const q = req.query.q ? `%${req.query.q.trim()}%` : null;

    let whereClause = `WHERE role = 'admin'`;
    const params = [];

    if (q) {
      params.push(q);
      whereClause += ` AND (full_name ILIKE $${params.length} OR phone ILIKE $${params.length})`;
    }

    const countRes = await query(`SELECT COUNT(*)::int AS total FROM users ${whereClause}`, params);
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const { rows } = await query(
      `SELECT id, full_name, phone, role, kyc_status, created_at, updated_at
       FROM users ${whereClause}
       ORDER BY created_at DESC
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

// POST /api/v1/superadmin/foremen
router.post(
  '/',
  requireSuperAdmin,
  validateBody(createForemanSchema),
  asyncHandler(async (req, res) => {
    const { fullName, phone } = req.body;

    const existing = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length) {
      throw new ApiError(400, 'User with this phone number already exists');
    }

    const { rows } = await query(
      `INSERT INTO users (full_name, phone, role, kyc_status)
       VALUES ($1, $2, 'admin', 'NOT_SUBMITTED')
       RETURNING *`,
      [fullName, phone]
    );

    await logAuditEvent(null, {
      eventType: 'FOREMAN_CREATED',
      actorId: req.superAdmin.id,
      actorType: 'SUPERADMIN',
      entityType: 'users',
      entityId: rows[0].id,
      afterState: rows[0],
      metadata: { fullName, phone },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: rows[0] });
  })
);

// GET /api/v1/superadmin/foremen/:id
router.get(
  '/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const userRes = await query('SELECT * FROM users WHERE id = $1 AND role = $2', [id, 'admin']);
    if (!userRes.rows.length) {
      throw new ApiError(404, 'Foreman not found');
    }

    const groupsRes = await query(
      `SELECT * FROM chit_groups WHERE foreman_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        foreman: userRes.rows[0],
        groups: groupsRes.rows,
      },
    });
  })
);

// PATCH /api/v1/superadmin/foremen/:id
router.patch(
  '/:id',
  requireSuperAdmin,
  validateBody(patchForemanSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    const foremanRes = await query('SELECT * FROM users WHERE id = $1 AND role = $2', [id, 'admin']);
    if (!foremanRes.rows.length) {
      throw new ApiError(404, 'Foreman not found');
    }

    const beforeState = foremanRes.rows[0];
    const newKycStatus = status === 'ACTIVE' ? 'APPROVED' : 'REJECTED';

    const { rows } = await query(
      `UPDATE users
       SET kyc_status = $1, updated_at = now()
       WHERE id = $2 RETURNING *`,
      [newKycStatus, id]
    );

    await logAuditEvent(null, {
      eventType: status === 'ACTIVE' ? 'FOREMAN_ACTIVATED' : 'FOREMAN_SUSPENDED',
      actorId: req.superAdmin.id,
      actorType: 'SUPERADMIN',
      entityType: 'users',
      entityId: id,
      beforeState,
      afterState: rows[0],
      metadata: { reason, status },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: rows[0] });
  })
);

export default router;
