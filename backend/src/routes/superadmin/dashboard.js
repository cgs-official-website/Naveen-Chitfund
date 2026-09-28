import express from 'express';
import { query } from '../../db.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requireSuperAdmin } from '../../middleware/superadminAuth.js';
import { toRupees } from '../../services/dividend.js';

const router = express.Router();

// GET /api/v1/superadmin/dashboard/summary
router.get(
  '/summary',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    // 1. Key Metrics
    const [
      aumRes,
      collectionsRes,
      activeGroupsRes,
      liveAuctionsRes,
      pendingKycRes,
      pendingSuretiesRes,
      subscribersRes,
      groupStatusRes,
      recentAuditRes,
      activeLiveRes,
    ] = await Promise.all([
      // Total AUM
      query(`SELECT COALESCE(SUM(chit_amount), 0) AS total_aum FROM chit_groups`),
      // Total collection (payments SUCCESS)
      query(`SELECT COALESCE(SUM(amount), 0) AS total_collected FROM payments WHERE status = 'SUCCESS'`),
      // Active Groups
      query(`SELECT COUNT(*)::int AS count FROM chit_groups WHERE status IN ('OPEN', 'ACTIVE')`),
      // Live Auctions
      query(`SELECT COUNT(*)::int AS count FROM chit_auctions WHERE status = 'LIVE'`),
      // Pending KYC
      query(`SELECT COUNT(*)::int AS count FROM users WHERE kyc_status = 'PENDING'`),
      // Pending Sureties
      query(`SELECT COUNT(*)::int AS count FROM sureties WHERE status IN ('PENDING', 'SUBMITTED')`),
      // Total Subscribers
      query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'user'`),
      // Group Status Breakdown
      query(`SELECT status, COUNT(*)::int AS count FROM chit_groups GROUP BY status`),
      // Recent Audit Feed
      query(
        `SELECT a.*, COALESCE(u.full_name, sa.full_name, 'System') as actor_name
         FROM audit_events a
         LEFT JOIN users u ON u.id = a.actor_id
         LEFT JOIN super_admins sa ON sa.id = a.actor_id
         ORDER BY a.created_at DESC LIMIT 10`
      ),
      // Active live auction details if any
      query(
        `SELECT ca.*, cg.name AS group_name, cg.chit_amount
         FROM chit_auctions ca
         JOIN chit_groups cg ON cg.id = ca.chit_group_id
         WHERE ca.status = 'LIVE'
         ORDER BY ca.created_at DESC LIMIT 1`
      ),
    ]);

    const totalAum = Number(aumRes.rows[0]?.total_aum || 0);
    const totalCollected = Number(collectionsRes.rows[0]?.total_collected || 0);
    const activeGroupsCount = activeGroupsRes.rows[0]?.count || 0;
    const liveAuctionsCount = liveAuctionsRes.rows[0]?.count || 0;
    const pendingKycCount = pendingKycRes.rows[0]?.count || 0;
    const pendingSuretiesCount = pendingSuretiesRes.rows[0]?.count || 0;
    const subscribersCount = subscribersRes.rows[0]?.count || 0;

    // Overdue installments estimation
    const overdueRes = await query(
      `SELECT COUNT(*)::int AS count FROM installments WHERE status = 'PENDING'`
    );
    const overdueCount = overdueRes.rows[0]?.count || 0;

    // 12-Month Collections vs Dues dynamic trend aggregated directly from DB
    const [trendPaymentsRes, trendInstallmentsRes] = await Promise.all([
      query(
        `SELECT 
           DATE_TRUNC('month', created_at) AS m_date,
           COALESCE(SUM(amount), 0)::bigint AS collected
         FROM payments
         WHERE status = 'SUCCESS' AND created_at >= NOW() - INTERVAL '12 months'
         GROUP BY m_date`
      ),
      query(
        `SELECT 
           DATE_TRUNC('month', due_date) AS m_date,
           COALESCE(SUM(amount_due), 0)::bigint AS dues
         FROM installments
         WHERE due_date >= NOW() - INTERVAL '12 months'
         GROUP BY m_date`
      ),
    ]);

    const collectedMap = {};
    trendPaymentsRes.rows.forEach((r) => {
      const key = new Date(r.m_date).toISOString().slice(0, 7);
      collectedMap[key] = Number(r.collected || 0);
    });

    const duesMap = {};
    trendInstallmentsRes.rows.forEach((r) => {
      const key = new Date(r.m_date).toISOString().slice(0, 7);
      duesMap[key] = Number(r.dues || 0);
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const mName = months[d.getMonth()];
      monthlyTrend.push({
        month: mName,
        dues: duesMap[key] || 0,
        collections: collectedMap[key] || 0,
      });
    }

    // Group Status donut data
    const statusMap = { OPEN: 0, ACTIVE: 0, COMPLETED: 0 };
    groupStatusRes.rows.forEach((r) => {
      if (statusMap[r.status] !== undefined) {
        statusMap[r.status] = r.count;
      }
    });

    res.json({
      success: true,
      data: {
        metrics: {
          totalAum,
          monthlyCollection: totalCollected,
          activeGroups: activeGroupsCount,
          liveAuctions: liveAuctionsCount,
          pendingKyc: pendingKycCount,
          pendingSureties: pendingSuretiesCount,
          overdueInstallments: overdueCount,
          totalSubscribers: subscribersCount,
        },
        monthlyTrend,
        groupStatusBreakdown: [
          { name: 'Open', value: statusMap.OPEN || 0, color: '#3B82F6' },
          { name: 'Active', value: statusMap.ACTIVE || 0, color: '#10B981' },
          { name: 'Completed', value: statusMap.COMPLETED || 0, color: '#6B7280' },
        ],
        recentAuditLogs: recentAuditRes.rows,
        liveAuction: activeLiveRes.rows[0] || null,
      },
    });
  })
);

export default router;
