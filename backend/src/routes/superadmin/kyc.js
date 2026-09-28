import express from 'express';
import { z } from 'zod';
import { query, logAuditEvent } from '../../db.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';
import { requireSuperAdmin } from '../../middleware/superadminAuth.js';
import { validateBody, getPagination } from '../../utils/validate.js';

const router = express.Router();

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().optional(),
}).refine((data) => data.status !== 'REJECTED' || (data.reason && data.reason.trim().length >= 5), {
  message: 'A rejection reason of at least 5 characters is mandatory when rejecting KYC',
  path: ['reason'],
});

// GET /api/v1/superadmin/kyc
router.get(
  '/',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const status = req.query.status || 'PENDING';
    const q = req.query.q ? `%${req.query.q.trim()}%` : null;

    let whereConditions = [];
    const params = [];

    if (status !== 'ALL') {
      params.push(status);
      whereConditions.push(`u.kyc_status = $${params.length}`);
    }

    if (q) {
      params.push(q);
      whereConditions.push(`(u.full_name ILIKE $${params.length} OR u.phone ILIKE $${params.length} OR u.pan_number ILIKE $${params.length})`);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*)::int AS total FROM users u ${whereClause}`, params);
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const { rows } = await query(
      `SELECT u.id, u.full_name, u.phone, u.role, u.kyc_status, u.pan_number, u.created_at, u.updated_at
       FROM users u
       ${whereClause}
       ORDER BY u.updated_at DESC
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

// PATCH /api/v1/superadmin/kyc/:id/review
router.patch(
  '/:id/review',
  requireSuperAdmin,
  validateBody(reviewSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;

    const userRes = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!userRes.rows.length) {
      throw new ApiError(404, 'User not found');
    }
    const beforeState = userRes.rows[0];

    const { rows } = await query(
      `UPDATE users
       SET kyc_status = $1, updated_at = now()
       WHERE id = $2 RETURNING *`,
      [status, id]
    );

    await logAuditEvent(null, {
      eventType: status === 'APPROVED' ? 'KYC_APPROVED' : 'KYC_REJECTED',
      actorId: req.superAdmin.id,
      actorType: 'SUPERADMIN',
      entityType: 'users',
      entityId: id,
      beforeState,
      afterState: rows[0],
      metadata: { reason: reason || null, reviewer: req.superAdmin.email },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: rows[0] });
  })
);

export default router;
