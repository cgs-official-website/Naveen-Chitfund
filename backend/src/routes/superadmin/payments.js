import express from 'express';
import { query } from '../../db.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requireSuperAdmin } from '../../middleware/superadminAuth.js';
import { getPagination } from '../../utils/validate.js';

const router = express.Router();

// GET /api/v1/superadmin/payments
router.get(
  '/',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const isCsv = req.query.format === 'csv';
    const status = req.query.status || null;
    const groupId = req.query.groupId || null;
    const q = req.query.q ? `%${req.query.q.trim()}%` : null;

    let whereConditions = [];
    const params = [];

    if (status) {
      params.push(status);
      whereConditions.push(`p.status = $${params.length}`);
    }
    if (groupId) {
      params.push(groupId);
      whereConditions.push(`cg.id = $${params.length}`);
    }
    if (q) {
      params.push(q);
      whereConditions.push(`(u.full_name ILIKE $${params.length} OR u.phone ILIKE $${params.length} OR p.razorpay_order_id ILIKE $${params.length} OR p.razorpay_payment_id ILIKE $${params.length})`);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    if (isCsv) {
      const { rows } = await query(
        `SELECT p.id, u.full_name, u.phone, cg.name AS group_name, s.ticket_number,
                p.amount, p.amount_paise, p.status, p.razorpay_order_id, p.razorpay_payment_id, p.created_at
         FROM payments p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN subscriptions s ON s.id = p.subscription_id
         LEFT JOIN chit_groups cg ON cg.id = s.chit_group_id
         ${whereClause}
         ORDER BY p.created_at DESC LIMIT 5000`,
        params
      );

      const headers = [
        'Payment ID',
        'Subscriber Name',
        'Phone',
        'Chit Group',
        'Ticket',
        'Amount (INR)',
        'Status',
        'Razorpay Order ID',
        'Razorpay Payment ID',
        'Created At',
      ];

      const csvRows = [headers.join(',')];
      rows.forEach((r) => {
        csvRows.push([
          `"${r.id}"`,
          `"${(r.full_name || '').replace(/"/g, '""')}"`,
          `"${r.phone || ''}"`,
          `"${(r.group_name || '').replace(/"/g, '""')}"`,
          `"${r.ticket_number || ''}"`,
          r.amount,
          r.status,
          `"${r.razorpay_order_id || ''}"`,
          `"${r.razorpay_payment_id || ''}"`,
          `"${r.created_at.toISOString()}"`,
        ].join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="payments-export.csv"');
      return res.send(csvRows.join('\n'));
    }

    const { page, limit, offset } = getPagination(req);
    const countRes = await query(
      `SELECT COUNT(*)::int AS total
       FROM payments p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN subscriptions s ON s.id = p.subscription_id
       LEFT JOIN chit_groups cg ON cg.id = s.chit_group_id
       ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const { rows } = await query(
      `SELECT p.*,
              u.full_name AS subscriber_name,
              u.phone AS subscriber_phone,
              s.ticket_number,
              cg.name AS group_name
       FROM payments p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN subscriptions s ON s.id = p.subscription_id
       LEFT JOIN chit_groups cg ON cg.id = s.chit_group_id
       ${whereClause}
       ORDER BY p.created_at DESC
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

export default router;
