import express from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { validateBody, getPagination, paginatedResponse } from '../utils/validate.js';
import { sendUserNotification } from '../services/notificationService.js';

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

    // Query recorded DPDP consents
    let consents = {};
    try {
      const consentRows = await query(
        'SELECT consent_type, granted FROM dpdp_consents WHERE user_id = $1',
        [u.id]
      );
      for (const r of consentRows.rows) {
        consents[r.consent_type] = r.granted;
      }
    } catch (e) {
      // Graceful fallback if table is freshly migrated
      consents = {};
    }

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
        consents,
        createdAt: u.created_at,
      },
    });
  })
);

// POST /api/v1/users/me/consents (DPDP Act, 2023 compliance)
router.post(
  '/me/consents',
  requireAuth,
  validateBody(z.object({ consents: z.record(z.boolean()) })),
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { consents } = req.body;
    const ip = req.ip;

    for (const [consentType, granted] of Object.entries(consents)) {
      await query(
        `INSERT INTO dpdp_consents (user_id, consent_type, granted, ip_address)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, consent_type)
         DO UPDATE SET granted = EXCLUDED.granted, granted_at = now(), ip_address = EXCLUDED.ip_address`,
        [userId, consentType, Boolean(granted), ip]
      );
    }

    res.json({ success: true, data: { message: 'DPDP consents updated' } });
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

    // Trigger notification to the user
    try {
      const isApproved = req.body.decision === 'APPROVED';
      await sendUserNotification({
        userId: req.params.id,
        title: isApproved ? 'KYC Verification Approved' : 'KYC Verification Update',
        body: isApproved
          ? 'Your identity verification is approved! You are now eligible to participate in live reverse auctions.'
          : 'Your KYC submission requires revision. Please re-upload your verification documents.',
        category: 'KYC',
        data: { decision: req.body.decision },
      });
    } catch (e) {
      console.error('Failed to dispatch KYC notification:', e.message);
    }

    res.json({ success: true, data: rows[0] });
  })
);

// POST /api/v1/users/push-token - Register device push token for mobile notifications
router.post(
  '/push-token',
  requireAuth,
  validateBody(
    z.object({
      token: z.string().min(5),
      platform: z.string().default('expo'),
      deviceInfo: z.record(z.any()).optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const { token, platform, deviceInfo } = req.body;
    const userId = req.user.userId;

    await query(
      `INSERT INTO user_push_tokens (user_id, token, platform, device_info, is_active, updated_at)
       VALUES ($1, $2, $3, $4, true, now())
       ON CONFLICT (user_id, token)
       DO UPDATE SET is_active = true, updated_at = now(), device_info = EXCLUDED.device_info`,
      [userId, token, platform, JSON.stringify(deviceInfo || {})]
    );

    res.json({ success: true, message: 'Push token registered successfully' });
  })
);

// GET /api/v1/users/notifications - Retrieve user notification feed
router.get(
  '/notifications',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { rows } = await query(
      `SELECT id, title, body, category, data, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({ success: true, data: rows });
  })
);

// PATCH /api/v1/users/notifications/:id/read - Mark notification as read
router.patch(
  '/notifications/:id/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id, is_read`,
      [req.params.id, req.user.userId]
    );
    if (!rows.length) throw new ApiError(404, 'Notification not found');
    res.json({ success: true, data: rows[0] });
  })
);

export default router;
