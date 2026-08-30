const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { validateBody, getPagination, paginatedResponse } = require('../utils/validate');

const router = express.Router();

const profileSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format').optional(),
});

// GET /api/v1/users/me
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    if (!rows.length) throw new ApiError(404, 'User not found');
    const u = rows[0];
    res.json({
      success: true,
      data: {
        id: u.id,
        fullName: u.full_name,
        phone: u.phone,
        email: u.email,
        role: u.role,
        kycStatus: u.kyc_status,
        panNumber: u.pan_number,
        createdAt: u.created_at,
      },
    });
  })
);

// PATCH /api/v1/users/me
router.patch(
  '/me',
  requireAuth,
  validateBody(profileSchema),
  asyncHandler(async (req, res) => {
    const { fullName, email, panNumber } = req.body;
    const { rows } = await query(
      `UPDATE users SET
         full_name = COALESCE($1, full_name),
         email = COALESCE($2, email),
         pan_number = COALESCE($3, pan_number),
         kyc_status = CASE WHEN $3 IS NOT NULL AND kyc_status = 'NOT_SUBMITTED' THEN 'PENDING' ELSE kyc_status END
       WHERE id = $4 RETURNING *`,
      [fullName, email, panNumber, req.user.userId]
    );
    res.json({ success: true, data: { id: rows[0].id, kycStatus: rows[0].kyc_status } });
  })
);

// --- Admin: KYC management ---

// GET /api/v1/users?kycStatus=PENDING&page=&limit=  (admin only)
router.get(
  '/',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const { kycStatus } = req.query;

    const where = kycStatus ? 'WHERE kyc_status = $1' : '';
    const params = kycStatus ? [kycStatus] : [];

    const countRes = await query(`SELECT COUNT(*) FROM users ${where}`, params);
    const rowsRes = await query(
      `SELECT id, full_name, phone, role, kyc_status, created_at FROM users ${where}
       ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: paginatedResponse(rowsRes.rows, parseInt(countRes.rows[0].count, 10), page, limit),
    });
  })
);

// POST /api/v1/users/:id/kyc  { decision: 'APPROVED' | 'REJECTED' }  (admin only)
router.post(
  '/:id/kyc',
  requireAuth,
  requireRole('admin'),
  validateBody(z.object({ decision: z.enum(['APPROVED', 'REJECTED']) })),
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `UPDATE users SET kyc_status = $1 WHERE id = $2 RETURNING id, kyc_status`,
      [req.body.decision, req.params.id]
    );
    if (!rows.length) throw new ApiError(404, 'User not found');
    res.json({ success: true, data: rows[0] });
  })
);

module.exports = router;
