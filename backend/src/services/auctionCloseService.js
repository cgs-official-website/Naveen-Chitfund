import { query, withTransaction, logAuditEvent } from '../db.js';
import { redis, auctionKey, auctionBidsKey } from '../redis.js';
import { calculateDividend, toRupees } from './dividend.js';
import { toPaise } from '../utils/money.js';
import { broadcastClose } from '../sockets/auctionSocket.js';
import { expireAuctionTickets } from './ticketService.js';
import { sendGroupNotification } from './notificationService.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Finalizes and closes an auction, whether triggered manually (admin force close / early stop)
 * or automatically by fixed-duration expiration.
 *
 * Atomically:
 * 1. Resolves winner (highest discount bid or 5% foreman commission floor).
 * 2. Marks auction as COMPLETED with winning details.
 * 3. Transitions winner subscription to 'SB' (Successful Bidder) per Chit Funds Act 1982.
 * 4. Initializes surety tracking record.
 * 5. Atomically transitions winner's ticket to 'USED' and all other tickets to 'EXPIRED'.
 * 6. Calculates Chit Fund Act compliant dividend and posts COMMISSION, PRIZE_PAYOUT, and DIVIDEND ledger entries.
 * 7. Broadcasts Socket.IO events and dispatches in-app notification to all group subscribers.
 */
export async function finalizeAuctionClose({
  auctionId,
  actorId = null,
  actorType = 'SYSTEM',
  reason = null,
  forceClosed = false,
  io = null,
}) {
  const auctionRes = await query('SELECT * FROM chit_auctions WHERE id = $1', [auctionId]);
  if (!auctionRes.rows.length) {
    throw new ApiError(404, 'Auction not found');
  }
  const auction = auctionRes.rows[0];

  if (auction.status === 'COMPLETED') {
    return { alreadyCompleted: true, auction };
  }

  const groupRes = await query('SELECT * FROM chit_groups WHERE id = $1', [auction.chit_group_id]);
  if (!groupRes.rows.length) {
    throw new ApiError(404, 'Chit group not found');
  }
  const group = groupRes.rows[0];

  // 1. Check Redis live state
  const rawState = await redis.get(auctionKey(auctionId));
  const state = rawState ? JSON.parse(rawState) : null;
  let winningPct = state?.highestBidPct ?? state?.lowestBidPct ?? null;
  let winningSubId = state?.bidderSubscriptionId || null;
  let winningTicket = state?.bidderTicketNumber || null;

  // 2. If no bids in Redis, inspect PostgreSQL auction_bids audit log
  if (!winningPct || !winningSubId) {
    const topBidRes = await query(
      `SELECT b.*, s.ticket_number
       FROM auction_bids b
       JOIN subscriptions s ON s.id = b.subscription_id
       WHERE b.auction_id = $1
       ORDER BY b.bid_pct DESC, b.bid_at ASC LIMIT 1`,
      [auctionId]
    );
    if (topBidRes.rows.length) {
      winningPct = Number(topBidRes.rows[0].bid_pct);
      winningSubId = topBidRes.rows[0].subscription_id;
      winningTicket = topBidRes.rows[0].ticket_number;
    }
  }

  // 3. Fallback to 5% statutory foreman commission floor if no subscriber placed a bid
  if (!winningPct || !winningSubId) {
    const subRes = await query(
      `SELECT id, ticket_number FROM subscriptions
       WHERE chit_group_id = $1 AND subscriber_status = 'NPS'
       ORDER BY ticket_number ASC LIMIT 1`,
      [auction.chit_group_id]
    );

    if (subRes.rows.length) {
      winningPct = Number(group.foreman_commission_pct || 5);
      winningSubId = subRes.rows[0].id;
      winningTicket = subRes.rows[0].ticket_number;
    } else {
      const anySubRes = await query(
        `SELECT id, ticket_number FROM subscriptions WHERE chit_group_id = $1 ORDER BY ticket_number ASC LIMIT 1`,
        [auction.chit_group_id]
      );
      if (!anySubRes.rows.length) {
        throw new ApiError(400, 'Cannot close auction: no eligible subscribers found in group');
      }
      winningPct = Number(group.foreman_commission_pct || 5);
      winningSubId = anySubRes.rows[0].id;
      winningTicket = anySubRes.rows[0].ticket_number;
    }
  }

  // 4. Execute atomic database transaction
  const result = await withTransaction(async (client) => {
    // A. Update auction record
    await client.query(
      `UPDATE chit_auctions
       SET status = 'COMPLETED', winning_bid_pct = $1, winning_subscription_id = $2, closed_at = now()
       WHERE id = $3`,
      [winningPct, winningSubId, auctionId]
    );

    // B. Mark winner as Successful Bidder (SB) under Chit Funds Act 1982
    await client.query(
      `UPDATE subscriptions SET subscriber_status = 'SB', prized_month = $1 WHERE id = $2`,
      [auction.month_number, winningSubId]
    );

    // C. Initialize pending surety verification record
    await client.query(
      `INSERT INTO sureties (subscription_id, auction_id, surety_type, status)
       VALUES ($1, $2, 'CO_GUARANTORS', 'PENDING')
       ON CONFLICT DO NOTHING`,
      [winningSubId, auctionId]
    );

    // D. Atomic ticket expiration: winner -> USED, all other active -> EXPIRED
    await expireAuctionTickets(client, auctionId, winningSubId);

    // E. Pull group subscriptions for dividend distribution
    const subsRes = await client.query(
      `SELECT id AS subscription_id, ticket_number, subscriber_status
       FROM subscriptions WHERE chit_group_id = $1`,
      [auction.chit_group_id]
    );
    const subscriptions = subsRes.rows.map((r) => ({
      subscriptionId: r.subscription_id,
      ticketNumber: r.ticket_number,
      subscriberStatus: r.subscriber_status,
    }));

    const dividend = calculateDividend({
      chitAmount: group.chit_amount,
      winningBidPct: winningPct,
      foremanCommissionPct: group.foreman_commission_pct,
      policy: group.dividend_distribution_policy,
      subscriptions,
      winningSubscriptionId: winningSubId,
    });

    // F. Ledger: Foreman Commission
    await client.query(
      `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount, amount_paise, auction_id)
       VALUES ($1, NULL, 'COMMISSION', $2, $3, $4)`,
      [auction.chit_group_id, toRupees(dividend.commissionPaise), dividend.commissionPaise, auctionId]
    );

    // G. Ledger: Prize Payout
    const chitAmountPaise = toPaise(Number(group.chit_amount));
    const bidDiscountPaise = Math.round((chitAmountPaise * Number(winningPct)) / 100);
    const prizeAmountPaise = chitAmountPaise - bidDiscountPaise;

    await client.query(
      `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount, amount_paise, auction_id)
       VALUES ($1, $2, 'PRIZE_PAYOUT', $3, $4, $5)`,
      [auction.chit_group_id, winningSubId, toRupees(prizeAmountPaise), prizeAmountPaise, auctionId]
    );

    // H. Ledger: Dividends per subscriber
    for (const p of dividend.perSubscriber) {
      await client.query(
        `INSERT INTO ledger_entries (chit_group_id, subscription_id, entry_type, amount, amount_paise, auction_id)
         VALUES ($1, $2, 'DIVIDEND', $3, $4, $5)`,
        [auction.chit_group_id, p.subscriptionId, toRupees(p.amountPaise), p.amountPaise, auctionId]
      );
    }

    // I. Audit log
    await logAuditEvent(client, {
      eventType: forceClosed ? 'AUCTION_FORCE_CLOSED' : 'AUCTION_CLOSED',
      actorId,
      actorType,
      entityType: 'chit_auctions',
      entityId: auctionId,
      metadata: {
        reason: reason || (forceClosed ? 'Superadmin early stop' : 'Auction timer completed'),
        winning_bid_pct: winningPct,
        winner_subscription_id: winningSubId,
        prize_amount_paise: prizeAmountPaise,
        total_distributed_paise: dividend.totalDistributedPaise,
      },
    });

    return { dividend, prizeAmount: toRupees(prizeAmountPaise) };
  });

  // 5. Clean up Redis state
  try {
    await redis.del(auctionKey(auctionId));
    await redis.del(auctionBidsKey(auctionId));
  } catch (redisErr) {
    console.warn('[AuctionClose] Redis cleanup warning:', redisErr.message);
  }

  // 6. Broadcast Real-time Sockets
  const closedAtIso = new Date().toISOString();
  if (io) {
    broadcastClose(io, auctionId, {
      winningBidPct: winningPct,
      winningSubscriptionId: winningSubId,
      winningTicketNumber: winningTicket,
      closedAt: closedAtIso,
      forceClosed,
      reason: reason || undefined,
    });
    io.to(`auction:${auctionId}`).emit('auction:tickets_expired', { auctionId });
  }

  // 7. Dispatch in-app and push notification to all subscribers in this Chit Group
  try {
    await sendGroupNotification({
      io,
      chitGroupId: auction.chit_group_id,
      title: `Auction Concluded: ${group.name}`,
      body: `Month #${auction.month_number} auction for ${group.name} has concluded! Winning bid discount: ${winningPct}%. Winning Ticket #${winningTicket || 'N/A'}.`,
      category: 'AUCTION',
      data: {
        auctionId,
        chitGroupId: auction.chit_group_id,
        monthNumber: auction.month_number,
        status: 'COMPLETED',
        winningBidPct: winningPct,
      },
    });
  } catch (notifErr) {
    console.warn('[AuctionClose] Notification dispatch error:', notifErr.message);
  }

  return {
    auctionId,
    status: 'COMPLETED',
    winningBidPct: winningPct,
    winningSubscriptionId: winningSubId,
    winnerSubscriptionId: winningSubId,
    winningTicketNumber: winningTicket,
    closedAt: closedAtIso,
    prizeAmount: result.prizeAmount,
    dividendPerSubscriber: result.dividend.perSubscriber.map((p) => ({
      subscriptionId: p.subscriptionId,
      amount: toRupees(p.amountPaise),
    })),
  };
}
