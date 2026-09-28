import express from 'express';
import { query } from '../../db.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';
import { requireSuperAdmin } from '../../middleware/superadminAuth.js';
import { getPagination } from '../../utils/validate.js';

const router = express.Router();

// GET /api/v1/superadmin/subscribers
router.get(
  '/',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const q = req.query.q ? `%${req.query.q.trim()}%` : null;
    const kycStatus = req.query.kycStatus || null;

    let whereConditions = [`u.role = 'user'`];
    const params = [];

    if (q) {
      params.push(q);
      whereConditions.push(`(u.full_name ILIKE $${params.length} OR u.phone ILIKE $${params.length})`);
    }
    if (kycStatus) {
      params.push(kycStatus);
      whereConditions.push(`u.kyc_status = $${params.length}`);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const countRes = await query(`SELECT COUNT(*)::int AS total FROM users u ${whereClause}`, params);
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const { rows } = await query(
      `SELECT u.id, u.full_name, u.phone, u.role, u.kyc_status, u.pan_number, u.created_at,
              COUNT(DISTINCT s.id)::int AS tickets_count,
              COUNT(DISTINCT CASE WHEN s.subscriber_status = 'PS' THEN s.id END)::int AS prized_tickets_count
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id
       ${whereClause}
       GROUP BY u.id
       ORDER BY u.created_at DESC
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

// GET /api/v1/superadmin/subscribers/:id
router.get(
  '/:id',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const userRes = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!userRes.rows.length) {
      throw new ApiError(404, 'Subscriber not found');
    }
    const subscriber = userRes.rows[0];

    // Subscriptions with group info
    const subsRes = await query(
      `SELECT s.*, cg.name AS group_name, cg.chit_amount, cg.duration_months
       FROM subscriptions s
       JOIN chit_groups cg ON cg.id = s.chit_group_id
       WHERE s.user_id = $1
       ORDER BY s.joined_at DESC`,
      [id]
    );

    // Installments history
    const instRes = await query(
      `SELECT i.*, s.ticket_number, cg.name AS group_name
       FROM installments i
       JOIN subscriptions s ON s.id = i.subscription_id
       JOIN chit_groups cg ON cg.id = s.chit_group_id
       WHERE s.user_id = $1
       ORDER BY i.created_at DESC LIMIT 50`,
      [id]
    );

    // Payments history
    const payRes = await query(
      `SELECT p.*, s.ticket_number, cg.name AS group_name
       FROM payments p
       LEFT JOIN subscriptions s ON s.id = p.subscription_id
       LEFT JOIN chit_groups cg ON cg.id = s.chit_group_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC LIMIT 50`,
      [id]
    );

    res.json({
      success: true,
      data: {
        subscriber,
        subscriptions: subsRes.rows,
        installments: instRes.rows,
        payments: payRes.rows,
      },
    });
  })
);

export default router;
