import express from 'express';
import { query } from '../../db.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requireSuperAdmin } from '../../middleware/superadminAuth.js';
import { getPagination } from '../../utils/validate.js';
import { toRupees } from '../../utils/money.js';

const router = express.Router();

// GET /api/v1/superadmin/ledger
router.get(
  '/',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const isCsv = req.query.format === 'csv';
    const entryType = req.query.entryType || null;
    const groupId = req.query.groupId || null;

    let whereConditions = [];
    const params = [];

    if (entryType && entryType !== 'ALL') {
      params.push(entryType);
      whereConditions.push(`l.entry_type = $${params.length}`);
    }
    if (groupId) {
      params.push(groupId);
      whereConditions.push(`l.chit_group_id = $${params.length}`);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    if (isCsv) {
      const { rows } = await query(
        `SELECT l.id, l.entry_type, cg.name AS group_name, s.ticket_number,
                u.full_name AS subscriber_name, l.amount, l.amount_paise, l.created_at
         FROM ledger_entries l
         LEFT JOIN chit_groups cg ON cg.id = l.chit_group_id
         LEFT JOIN subscriptions s ON s.id = l.subscription_id
         LEFT JOIN users u ON u.id = s.user_id
         ${whereClause}
         ORDER BY l.created_at DESC LIMIT 5000`,
        params
      );

      const headers = ['Entry ID', 'Entry Type', 'Chit Group', 'Ticket', 'Subscriber', 'Amount (INR)', 'Amount (Paise)', 'Date'];
      const csvRows = [headers.join(',')];

      rows.forEach((r) => {
        csvRows.push([
          `"${r.id}"`,
          r.entry_type,
          `"${(r.group_name || '').replace(/"/g, '""')}"`,
          `"${r.ticket_number || ''}"`,
          `"${(r.subscriber_name || 'N/A').replace(/"/g, '""')}"`,
          r.amount,
          r.amount_paise,
          `"${r.created_at.toISOString()}"`,
        ].join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ledger-export.csv"');
      return res.send(csvRows.join('\n'));
    }

    const { page, limit, offset } = getPagination(req);
    const countRes = await query(`SELECT COUNT(*)::int AS total FROM ledger_entries l ${whereClause}`, params);
    const total = countRes.rows[0]?.total || 0;

    // Aggregate totals in paise
    const sumRes = await query(
      `SELECT entry_type, COALESCE(SUM(amount_paise), 0)::bigint AS sum_paise
       FROM ledger_entries l ${whereClause}
       GROUP BY entry_type`,
      params
    );

    const totalsByEntryType = {};
    (sumRes.rows || []).forEach((r) => {
      const paiseVal = parseInt(r.sum_paise, 10) || 0;
      totalsByEntryType[r.entry_type] = {
        amountPaise: paiseVal,
        amountRupees: toRupees(paiseVal),
      };
    });

    const dataParams = [...params, limit, offset];
    const { rows } = await query(
      `SELECT l.*,
              cg.name AS group_name,
              s.ticket_number,
              u.full_name AS subscriber_name
       FROM ledger_entries l
       LEFT JOIN chit_groups cg ON cg.id = l.chit_group_id
       LEFT JOIN subscriptions s ON s.id = l.subscription_id
       LEFT JOIN users u ON u.id = s.user_id
       ${whereClause}
       ORDER BY l.created_at DESC
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
        totalsByEntryType,
      },
    });
  })
);

export default router;
