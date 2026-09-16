import express from 'express';
import { z } from 'zod';
import { query, logAuditEvent } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { getPagination, paginatedResponse, validateBody } from '../utils/validate.js';

const router = express.Router();

// All routes below are admin-only.
router.use(requireAuth, requireRole('admin'));

// GET /api/v1/admin/dashboard — totals for admin home
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const [groups, aum, pendingKyc, todaysAuctions] = await Promise.all([
      query(`SELECT COUNT(*) FROM chit_groups WHERE status IN ('OPEN','RUNNING')`),
      query(`SELECT COALESCE(SUM(chit_amount),0) AS total FROM chit_groups WHERE status IN ('OPEN','RUNNING')`),
      query(`SELECT COUNT(*) FROM users WHERE kyc_status = 'PENDING'`),
      query(
        `SELECT COUNT(*) FROM chit_auctions
         WHERE status IN ('SCHEDULED','LIVE') AND scheduled_at::date = CURRENT_DATE`
      ),
    ]);

    res.json({
      success: true,
      data: {
        activeGroups: parseInt(groups.rows[0].count, 10),
        totalAUM: Number(aum.rows[0].total),
        pendingKyc: parseInt(pendingKyc.rows[0].count, 10),
        todaysAuctions: parseInt(todaysAuctions.rows[0].count, 10),
      },
    });
  })
);

// GET /api/v1/admin/ledger?groupId=&subscriptionId=&from=&to=&page=&limit=
router.get(
  '/ledger',
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const { groupId, subscriptionId, from, to } = req.query;

    const conditions = [];
    const params = [];

    if (groupId) {
      params.push(groupId);
      conditions.push(`chit_group_id = $${params.length}`);
    }
    if (subscriptionId) {
      params.push(subscriptionId);
      conditions.push(`subscription_id = $${params.length}`);
    }
    if (from) {
      params.push(from);
      conditions.push(`created_at >= $${params.length}`);
    }
    if (to) {
      params.push(to);
      conditions.push(`created_at <= $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM ledger_entries ${where}`, params);
    const rowsRes = await query(
      `SELECT * FROM ledger_entries ${where}
       ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: paginatedResponse(rowsRes.rows, parseInt(countRes.rows[0].count, 10), page, limit),
    });
  })
);

// GET /api/v1/admin/auctions?groupId=&status=&page=&limit=
router.get(
  '/auctions',
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const { groupId, status } = req.query;

    const conditions = [];
    const params = [];
    if (groupId) {
      params.push(groupId);
      conditions.push(`chit_group_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM chit_auctions ${where}`, params);
    const rowsRes = await query(
      `SELECT * FROM chit_auctions ${where}
       ORDER BY scheduled_at DESC NULLS LAST LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: paginatedResponse(rowsRes.rows, parseInt(countRes.rows[0].count, 10), page, limit),
    });
  })
);

// GET /api/v1/admin/subscribers?groupId=&search=&page=&limit=
router.get(
  '/subscribers',
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const { groupId, search } = req.query;

    const conditions = [];
    const params = [];
    if (groupId) {
      params.push(groupId);
      conditions.push(`s.chit_group_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.full_name ILIKE $${params.length} OR u.phone ILIKE $${params.length})`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) FROM subscriptions s JOIN users u ON u.id = s.user_id ${where}`,
      params
    );
    const rowsRes = await query(
      `SELECT s.id, s.ticket_number, s.subscriber_status, s.chit_group_id,
              u.id AS user_id, u.full_name, u.phone, u.kyc_status
       FROM subscriptions s JOIN users u ON u.id = s.user_id
       ${where}
       ORDER BY s.joined_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: paginatedResponse(rowsRes.rows, parseInt(countRes.rows[0].count, 10), page, limit),
    });
  })
);

// GET /api/v1/admin/kyc/pending — list pending KYC applicants
router.get(
  '/kyc/pending',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT id, phone, full_name, role, kyc_status, pan_number, aadhaar_vault_ref, created_at
       FROM users
       WHERE kyc_status = 'PENDING'
       ORDER BY created_at ASC`
    );
    res.json({ success: true, data: rows });
  })
);

// POST /api/v1/admin/kyc/:id/review — approve or reject user KYC
const reviewKycSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  reason: z.string().optional(),
});

router.post(
  '/kyc/:id/review',
  validateBody(reviewKycSchema),
  asyncHandler(async (req, res) => {
    const { status, reason } = req.body;
    const { rows } = await query(
      `UPDATE users
       SET kyc_status = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, phone, full_name, role, kyc_status`,
      [status, req.params.id]
    );
    if (!rows.length) throw new ApiError(404, 'User not found');

    await logAuditEvent(null, {
      eventType: 'KYC_REVIEWED',
      actorId: req.user.userId,
      entityType: 'users',
      entityId: req.params.id,
      afterState: rows[0],
      metadata: { status, reason },
    });

    res.json({ success: true, data: rows[0] });
  })
);

// POST /api/v1/admin/auctions/schedule — schedule a new auction session
const scheduleAuctionSchema = z.object({
  chitGroupId: z.string().uuid(),
  monthNumber: z.number().int().positive(),
  scheduledAt: z.string(),
});

router.post(
  '/auctions/schedule',
  validateBody(scheduleAuctionSchema),
  asyncHandler(async (req, res) => {
    const { chitGroupId, monthNumber, scheduledAt } = req.body;

    const groupRes = await query(`SELECT * FROM chit_groups WHERE id = $1`, [chitGroupId]);
    if (!groupRes.rows.length) throw new ApiError(404, 'Chit group not found');

    const { rows } = await query(
      `INSERT INTO chit_auctions (chit_group_id, month_number, scheduled_at, status)
       VALUES ($1, $2, $3, 'SCHEDULED')
       ON CONFLICT (chit_group_id, month_number) DO UPDATE
       SET scheduled_at = EXCLUDED.scheduled_at, status = 'SCHEDULED'
       RETURNING *`,
      [chitGroupId, monthNumber, scheduledAt]
    );

    await logAuditEvent(null, {
      eventType: 'AUCTION_SCHEDULED',
      actorId: req.user.userId,
      entityType: 'chit_auctions',
      entityId: rows[0].id,
      afterState: rows[0],
      metadata: { chitGroupId, monthNumber, scheduledAt },
    });

    res.status(201).json({ success: true, data: rows[0] });
  })
);

export default router;
