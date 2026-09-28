import express from 'express';
import { query } from '../../db.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { requireSuperAdmin } from '../../middleware/superadminAuth.js';
import { getPagination } from '../../utils/validate.js';

const router = express.Router();

// GET /api/v1/superadmin/audit-logs
router.get(
  '/',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const actorType = req.query.actorType || null;
    const eventType = req.query.eventType || null;
    const q = req.query.q ? `%${req.query.q.trim()}%` : null;

    let whereConditions = [];
    const params = [];

    if (actorType && actorType !== 'ALL') {
      params.push(actorType);
      whereConditions.push(`a.actor_type = $${params.length}`);
    }
    if (eventType && eventType !== 'ALL') {
      params.push(eventType);
      whereConditions.push(`a.event_type = $${params.length}`);
    }
    if (q) {
      params.push(q);
      whereConditions.push(`(a.event_type ILIKE $${params.length} OR a.entity_type ILIKE $${params.length} OR a.ip_address ILIKE $${params.length} OR COALESCE(u.full_name, sa.full_name) ILIKE $${params.length})`);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*)::int AS total
       FROM audit_events a
       LEFT JOIN users u ON u.id = a.actor_id
       LEFT JOIN super_admins sa ON sa.id = a.actor_id
       ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const { rows } = await query(
      `SELECT a.*,
              COALESCE(u.full_name, sa.full_name, 'System') AS actor_name,
              COALESCE(u.phone, sa.email, 'N/A') AS actor_identifier
       FROM audit_events a
       LEFT JOIN users u ON u.id = a.actor_id
       LEFT JOIN super_admins sa ON sa.id = a.actor_id
       ${whereClause}
       ORDER BY a.created_at DESC
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
