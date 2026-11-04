import { query, logAuditEvent } from '../db.js';
import { redis, auctionKey, auctionBidsKey, createLiveAuctionState } from '../redis.js';
import { broadcastStart } from '../sockets/auctionSocket.js';
import { sendGroupNotification } from './notificationService.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Starts an auction session: moves status from SCHEDULED to LIVE,
 * initializes Redis live state with duration countdown, broadcasts start event
 * over WebSockets, dispatches group notifications to active subscribers,
 * and records an audit log.
 */
export async function startAuctionSession({ auctionId, actorId = null, actorType = 'SYSTEM', io = null }) {
  // 1. Atomically move status from SCHEDULED to LIVE
  const { rows } = await query(
    `UPDATE chit_auctions
     SET status = 'LIVE', started_at = COALESCE(started_at, now())
     WHERE id = $1 AND status = 'SCHEDULED'
     RETURNING *`,
    [auctionId]
  );

  if (!rows.length) {
    const checkRes = await query('SELECT * FROM chit_auctions WHERE id = $1', [auctionId]);
    if (checkRes.rows.length && checkRes.rows[0].status === 'LIVE') {
      return checkRes.rows[0];
    }
    throw new ApiError(400, 'Auction not found or not in SCHEDULED state');
  }

  const auction = rows[0];

  // 2. Fetch chit group details
  const groupRes = await query(
    'SELECT name, chit_amount, foreman_commission_pct FROM chit_groups WHERE id = $1',
    [auction.chit_group_id]
  );
  const group = groupRes.rows[0] || {};
  const minCommission = Number(group.foreman_commission_pct || 5);
  const durationSeconds = Number(auction.duration_seconds || 300);
  const startedAtMs = Date.now();

  // 3. Initialize Redis live auction state with fixed duration
  const initialLiveState = createLiveAuctionState({
    minBidPct: minCommission,
    durationSeconds,
    startedAt: startedAtMs,
  });
  await redis.set(auctionKey(auctionId), JSON.stringify(initialLiveState));
  await redis.del(auctionBidsKey(auctionId));

  // 4. Broadcast live start over WebSockets (global and room)
  if (io) {
    broadcastStart(io, auctionId, {
      auction,
      chitGroupId: auction.chit_group_id,
      monthNumber: auction.month_number,
      groupName: group.name || 'Chit Group',
      chitAmount: group.chit_amount,
      startedAt: new Date(startedAtMs).toISOString(),
      durationSeconds,
      remainingSeconds: durationSeconds,
    });
  }

  // 5. Send push & in-app group notification to all active subscribers
  try {
    const groupName = group.name || 'Chit Group';
    await sendGroupNotification({
      io,
      chitGroupId: auction.chit_group_id,
      title: `Live Reverse Auction: ${groupName}`,
      body: `Month #${auction.month_number} reverse auction for ${groupName} is now LIVE! Bidding window is open for ${Math.round(durationSeconds / 60)} minutes. Place your bids!`,
      category: 'AUCTION',
      data: {
        auctionId: auction.id,
        chitGroupId: auction.chit_group_id,
        monthNumber: auction.month_number,
        status: 'LIVE',
      },
    });
  } catch (notifErr) {
    console.warn('[startAuctionSession] Failed to dispatch group notification:', notifErr.message);
  }

  // 6. Record audit event
  const isUuid = typeof actorId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actorId);
  await logAuditEvent(null, {
    eventType: 'AUCTION_STARTED',
    actorId: isUuid ? actorId : null,
    actorType,
    entityType: 'chit_auctions',
    entityId: auctionId,
    metadata: {
      monthNumber: auction.month_number,
      status: 'LIVE',
      durationSeconds,
      startedBy: actorType,
      actorIdRaw: actorId,
    },
  });

  return auction;
}
