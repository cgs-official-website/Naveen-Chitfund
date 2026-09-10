const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPagination, paginatedResponse } = require('../utils/validate');

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

module.exports = router;
