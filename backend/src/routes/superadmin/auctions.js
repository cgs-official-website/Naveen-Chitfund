import express from 'express';
import { z } from 'zod';
import { query, withTransaction, logAuditEvent } from '../../db.js';
import { redis, auctionKey, auctionBidsKey, createLiveAuctionState } from '../../redis.js';
import { asyncHandler, ApiError } from '../../middleware/errorHandler.js';
import { requireSuperAdmin } from '../../middleware/superadminAuth.js';
import { validateBody, getPagination } from '../../utils/validate.js';
import { calculateDividend, toRupees } from '../../services/dividend.js';
import { broadcastClose, broadcastStart } from '../../sockets/auctionSocket.js';
import { toPaise } from '../../utils/money.js';
import {
  expireAuctionTickets,
  revokeTicket,
  approveAuctionTicket,
  rejectAuctionTicket,
} from '../../services/ticketService.js';
import { sendUserNotification, sendGroupNotification } from '../../services/notificationService.js';
import { finalizeAuctionClose } from '../../services/auctionCloseService.js';
import { startAuctionSession } from '../../services/auctionStartService.js';

const router = express.Router();

const forceCloseSchema = z.object({
  reason: z.string().min(5, 'Mandatory reason of at least 5 characters required to force-close auction'),
});

const revokeTicketSchema = z.object({
  reason: z.string().min(3, 'Revocation reason is required'),
});

const rejectApplicationSchema = z.object({
  reason: z.string().min(3, 'Rejection reason is required').optional(),
});

const createAuctionSchema = z.object({
  chitGroupId: z.string().uuid('Valid Chit Group ID is required'),
  monthNumber: z.number().int().positive('Month number must be positive'),
  scheduledAt: z.string().optional(),
  durationMinutes: z.number().int().min(1).max(120).optional().default(5),
  startImmediately: z.boolean().optional(),
  maxParticipants: z.number().int().positive().optional().default(20),
});

// GET /api/v1/superadmin/auctions
router.get(
  '/',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req);
    const status = req.query.status || null;
    const groupId = req.query.groupId || null;

    let whereConditions = [];
    const params = [];

    if (status) {
      params.push(status);
      whereConditions.push(`ca.status = $${params.length}`);
    }
    if (groupId) {
      params.push(groupId);
      whereConditions.push(`ca.chit_group_id = $${params.length}`);
    }

    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*)::int AS total FROM chit_auctions ca ${whereClause}`, params);
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const { rows } = await query(
      `SELECT ca.*,
              cg.name AS group_name,
              cg.chit_amount,
              cg.duration_months,
              COALESCE(u.full_name, live_u.full_name) AS winner_name,
              COALESCE(s.ticket_number, live_s.ticket_number) AS winner_ticket_number,
              COALESCE(ca.winning_bid_pct, latest_bid.bid_pct) AS winning_bid_pct,
              (SELECT COUNT(*)::int FROM auction_tickets t WHERE t.auction_id = ca.id AND t.status IN ('APPLIED', 'PENDING')) AS pending_tickets_count,
              (SELECT COUNT(*)::int FROM auction_tickets t WHERE t.auction_id = ca.id AND t.status = 'ACTIVE') AS active_tickets_count
       FROM chit_auctions ca
       JOIN chit_groups cg ON cg.id = ca.chit_group_id
       LEFT JOIN subscriptions s ON s.id = ca.winning_subscription_id
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN LATERAL (
         SELECT b.subscription_id, b.bid_pct
         FROM auction_bids b
         WHERE b.auction_id = ca.id
         ORDER BY b.bid_pct DESC, b.bid_at ASC
         LIMIT 1
       ) latest_bid ON true
       LEFT JOIN subscriptions live_s ON live_s.id = latest_bid.subscription_id
       LEFT JOIN users live_u ON live_u.id = live_s.user_id
       ${whereClause}
       ORDER BY ca.created_at DESC
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

// GET /api/v1/superadmin/auctions/:id/bids
router.get(
  '/:id/bids',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const auctionRes = await query(
      `SELECT ca.*, cg.name AS group_name, cg.chit_amount, cg.foreman_commission_pct
       FROM chit_auctions ca
       JOIN chit_groups cg ON cg.id = ca.chit_group_id
       WHERE ca.id = $1`,
      [id]
    );
    if (!auctionRes.rows.length) throw new ApiError(404, 'Auction not found');
    const auction = auctionRes.rows[0];

    // Live redis state
    const rawState = await redis.get(auctionKey(id));
    const liveState = rawState ? JSON.parse(rawState) : null;

    // Database bids audit trail
    const bidsRes = await query(
      `SELECT b.*, s.ticket_number, u.full_name AS bidder_name
       FROM auction_bids b
       JOIN subscriptions s ON s.id = b.subscription_id
       JOIN users u ON u.id = s.user_id
       WHERE b.auction_id = $1
       ORDER BY b.bid_pct DESC, b.bid_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        auction,
        liveState,
        bids: bidsRes.rows,
      },
    });
  })
);

// GET /api/v1/superadmin/auctions/:id/tickets (List all tickets for an auction)
router.get(
  '/:id/tickets',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit, offset } = getPagination(req);
    const status = req.query.status || null;

    let whereClause = 'WHERE t.auction_id = $1';
    const params = [id];

    if (status) {
      params.push(status);
      whereClause += ` AND t.status = $${params.length}`;
    }

    const countRes = await query(
      `SELECT COUNT(*)::int AS total FROM auction_tickets t ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, limit, offset];
    const { rows } = await query(
      `SELECT t.*,
              s.ticket_number,
              s.subscriber_status,
              u.full_name,
              u.phone,
              u.email,
              u.kyc_status
       FROM auction_tickets t
       JOIN subscriptions s ON s.id = t.subscription_id
       JOIN users u ON u.id = t.user_id
       ${whereClause}
       ORDER BY t.issued_at DESC
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

// POST /api/v1/superadmin/auctions/:id/tickets/:ticketId/revoke (Revoke a ticket)
router.post(
  '/:id/tickets/:ticketId/revoke',
  requireSuperAdmin,
  validateBody(revokeTicketSchema),
  asyncHandler(async (req, res) => {
    const { id, ticketId } = req.params;
    const { reason } = req.body;

    const updatedTicket = await revokeTicket(
      { query },
      ticketId,
      reason,
      req.superAdmin.id
    );

    await logAuditEvent(null, {
      eventType: 'AUCTION_TICKET_REVOKED',
      actorId: req.superAdmin.id,
      actorType: 'SUPERADMIN',
      entityType: 'auction_tickets',
      entityId: ticketId,
      metadata: { auctionId: id, ticketCode: updatedTicket.ticket_code, reason },
      ipAddress: req.ip,
    });

    const io = req.app.get('io');
    if (io) {
      const payload = {
        auctionId: id,
        ticketId,
        ticketCode: updatedTicket.ticket_code,
        userId: updatedTicket.user_id,
        reason,
      };
      io.to(`auction:${id}`).emit('auction:ticket_revoked', payload);
      io.emit('auction:ticket_revoked', payload);
    }

    res.json({
      success: true,
      message: 'Ticket revoked successfully',
      data: updatedTicket,
    });
  })
);

// POST /api/v1/superadmin/auctions/:id/tickets/:ticketId/approve (Approve an applied ticket)
router.post(
  '/:id/tickets/:ticketId/approve',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id, ticketId } = req.params;

    const approvedTicket = await approveAuctionTicket(
      { query },
      ticketId,
      req.superAdmin.id
    );

    await logAuditEvent(null, {
      eventType: 'AUCTION_TICKET_APPROVED',
      actorId: req.superAdmin.id,
      actorType: 'SUPERADMIN',
      entityType: 'auction_tickets',
      entityId: ticketId,
      metadata: { auctionId: id, ticketCode: approvedTicket.ticket_code },
      ipAddress: req.ip,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`auction:${id}`).emit('auction:ticket_approved', {
        auctionId: id,
        ticketId,
        ticketCode: approvedTicket.ticket_code,
        userId: approvedTicket.user_id,
        status: 'ACTIVE',
      });
      io.emit('auction:ticket_approved', {
        auctionId: id,
        ticketId,
        ticketCode: approvedTicket.ticket_code,
        userId: approvedTicket.user_id,
        status: 'ACTIVE',
      });
    }

    // Persist in-app notification & send push alert to subscriber
    try {
      await sendUserNotification({
        userId: approvedTicket.user_id,
        title: 'Auction Ticket Approved! 🎉',
        body: `Your bidding ticket ${approvedTicket.ticket_code} has been approved by the Superadmin. You can now place bids in the live reverse auction!`,
        category: 'AUCTION',
        data: { auctionId: id, ticketCode: approvedTicket.ticket_code, ticketId, status: 'ACTIVE' },
      });
    } catch (notifErr) {
      console.warn('[TicketApproval] Failed to dispatch user notification:', notifErr.message);
    }

    res.json({
      success: true,
      message: 'Ticket approved successfully. User can now access live auction.',
      data: approvedTicket,
    });
  })
);

// POST /api/v1/superadmin/auctions/:id/start (Move scheduled auction to LIVE)
router.post(
  '/:id/start',
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const io = req.app.get('io');
    const auction = await startAuctionSession({
      auctionId: id,
      actorId: req.superAdmin?.id || null,
      actorType: 'SUPERADMIN',
      io,
    });
    res.json({ success: true, message: 'Auction is now LIVE', data: auction });
  })
);

// POST /api/v1/superadmin/auctions/:id/tickets/:ticketId/reject (Reject an applied ticket)
router.post(
  '/:id/tickets/:ticketId/reject',
  requireSuperAdmin,
  validateBody(rejectApplicationSchema),
  asyncHandler(async (req, res) => {
    const { id, ticketId } = req.params;
    const { reason } = req.body;

    const rejectedTicket = await rejectAuctionTicket(
      { query },
      ticketId,
      reason,
      req.superAdmin.id
    );

    await logAuditEvent(null, {
      eventType: 'AUCTION_TICKET_REJECTED',
      actorId: req.superAdmin.id,
      actorType: 'SUPERADMIN',
      entityType: 'auction_tickets',
      entityId: ticketId,
      metadata: { auctionId: id, reason },
      ipAddress: req.ip,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`auction:${id}`).emit('auction:ticket_rejected', {
        auctionId: id,
        ticketId,
        userId: rejectedTicket.user_id,
        reason,
        status: 'REJECTED',
      });
      io.emit('auction:ticket_rejected', {
        auctionId: id,
        ticketId,
        userId: rejectedTicket.user_id,
        reason,
        status: 'REJECTED',
      });
    }

    res.json({
      success: true,
      message: 'Ticket application rejected.',
      data: rejectedTicket,
    });
  })
);

// POST /api/v1/superadmin/auctions/:id/force-close
router.post(
  '/:id/force-close',
  requireSuperAdmin,
  validateBody(forceCloseSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const io = req.app.get('io');
    const result = await finalizeAuctionClose({
      auctionId: id,
      actorId: req.superAdmin.id,
      actorType: 'SUPERADMIN',
      reason,
      forceClosed: true,
      io,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// POST /api/v1/superadmin/auctions (Create / Schedule a new auction round)
router.post(
  '/',
  requireSuperAdmin,
  validateBody(createAuctionSchema),
  asyncHandler(async (req, res) => {
    const { chitGroupId, monthNumber, scheduledAt, startImmediately, maxParticipants, durationMinutes } = req.body;

    const groupRes = await query('SELECT * FROM chit_groups WHERE id = $1', [chitGroupId]);
    if (!groupRes.rows.length) throw new ApiError(404, 'Chit group not found');
    const group = groupRes.rows[0];

    // Check if an auction already exists for this group and month
    const existing = await query(
      'SELECT id, status FROM chit_auctions WHERE chit_group_id = $1 AND month_number = $2',
      [chitGroupId, monthNumber]
    );
    if (existing.rows.length) {
      throw new ApiError(400, `Auction for Month #${monthNumber} already exists (${existing.rows[0].status})`);
    }

    const initialStatus = startImmediately ? 'LIVE' : 'SCHEDULED';
    const scheduledDate = scheduledAt
      ? new Date(scheduledAt).toISOString()
      : new Date(Date.now() + 3600 * 1000).toISOString();
    const limitCount = maxParticipants || group.duration_months || 20;
    const durationSeconds = Number(durationMinutes || 5) * 60;

    let newAuction;
    try {
      const { rows } = await query(
        `INSERT INTO chit_auctions (chit_group_id, month_number, status, scheduled_at, max_participants, duration_seconds)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [chitGroupId, monthNumber, initialStatus, scheduledDate, limitCount, durationSeconds]
      );
      newAuction = rows[0];
    } catch (insertErr) {
      // Fallback if max_participants column doesn't exist yet
      const { rows } = await query(
        `INSERT INTO chit_auctions (chit_group_id, month_number, status, scheduled_at, duration_seconds)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [chitGroupId, monthNumber, initialStatus, scheduledDate, durationSeconds]
      );
      newAuction = rows[0];
    }

    const io = req.app.get('io');

    if (startImmediately) {
      await startAuctionSession({
        auctionId: newAuction.id,
        actorId: req.superAdmin?.id || null,
        actorType: 'SUPERADMIN',
        io,
      });
    } else {
      // Scheduled: notify subscribers so they can apply for tokens in advance
      try {
        const schedDateText = scheduledAt
          ? new Date(scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
          : new Date(scheduledDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        await sendGroupNotification({
          io,
          chitGroupId,
          title: `New Auction Scheduled: ${group.name}`,
          body: `Month #${monthNumber} auction for ${group.name} is scheduled for ${schedDateText}. Apply for your bidding token in advance.`,
          category: 'AUCTION',
          data: { auctionId: newAuction.id, chitGroupId, monthNumber, status: 'SCHEDULED', scheduledAt: scheduledDate },
        });
      } catch (notifErr) {
        console.warn('Auction scheduled notification error:', notifErr.message);
      }

      if (io) {
        io.emit('auction:scheduled', {
          auctionId: newAuction.id,
          chitGroupId,
          monthNumber,
          groupName: group.name,
          scheduledAt: scheduledDate,
          durationSeconds,
        });
        io.emit('auction_scheduled', {
          auctionId: newAuction.id,
          chitGroupId,
          monthNumber,
          groupName: group.name,
          scheduledAt: scheduledDate,
          durationSeconds,
        });
      }
    }

    try {
      await logAuditEvent(null, {
        eventType: 'AUCTION_CREATED',
        actorId: req.superAdmin?.id || null,
        actorType: 'SUPERADMIN',
        entityType: 'chit_auctions',
        entityId: newAuction.id,
        metadata: { chitGroupId, monthNumber, status: initialStatus, maxParticipants: limitCount, scheduledAt: scheduledDate, durationSeconds },
        ipAddress: req.ip,
      });
    } catch (auditErr) {
      console.warn('Audit event log warning:', auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: startImmediately ? 'Live auction created and started successfully' : 'Auction scheduled successfully',
      data: {
        ...newAuction,
        group_name: group.name,
        chit_amount: group.chit_amount,
      },
    });
  })
);

export default router;

