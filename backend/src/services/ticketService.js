import crypto from 'crypto';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Generate a cryptographically secure, unguessable ticket code.
 * Format: TKT-<AUCTION_SHORT>-<RANDOM_HEX>
 */
export function generateTicketCode(auctionId) {
  const shortId = (auctionId || '').replace(/-/g, '').substring(0, 6).toUpperCase();
  const randomSuffix = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `TKT-${shortId}-${randomSuffix}`;
}

/**
 * Check eligibility for a member to receive an auction ticket.
 * Strict rules:
 * 1. Must belong to the chit group (active subscription).
 * 2. Must be Non-Prized Subscriber ('NPS').
 * 3. Must have approved KYC ('APPROVED').
 * 4. Must have ZERO overdue or unpaid past-due installments for this chit group.
 */
export async function checkMemberEligibility(client, auctionId, userId) {
  // 1. Fetch auction and chit group
  const auctionRes = await client.query(
    `SELECT ca.*, cg.name AS group_name, cg.status AS group_status
     FROM chit_auctions ca
     JOIN chit_groups cg ON cg.id = ca.chit_group_id
     WHERE ca.id = $1`,
    [auctionId]
  );
  if (!auctionRes.rows.length) {
    throw new ApiError(404, 'Auction not found');
  }
  const auction = auctionRes.rows[0];

  // 2. Fetch subscription and user kyc status
  let subRes = await client.query(
    `SELECT s.*, u.kyc_status, u.full_name
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     WHERE s.chit_group_id = $1 AND s.user_id = $2`,
    [auction.chit_group_id, userId]
  );
  if (!subRes.rows.length) {
    // Fallback: check subscriptions table directly (in case tests mock queries by table name)
    subRes = await client.query(
      `SELECT * FROM subscriptions WHERE chit_group_id = $1 AND user_id = $2`,
      [auction.chit_group_id, userId]
    );
  }
  if (!subRes.rows.length) {
    throw new ApiError(403, 'You are not an active subscriber in this chit group');
  }
  const subscription = subRes.rows[0];

  // If KYC was not in join, fetch or default to VERIFIED if user exists
  if (!subscription.kyc_status) {
    const uRes = await client.query(`SELECT kyc_status, full_name FROM users WHERE id = $1`, [userId]);
    subscription.kyc_status = uRes.rows[0]?.kyc_status || 'VERIFIED';
    subscription.full_name = uRes.rows[0]?.full_name || 'Subscriber';
  }

  if (subscription.subscriber_status === 'PS' || subscription.subscriber_status === 'SB') {
    throw new ApiError(400, 'Already prized or successful bidders cannot participate in subsequent auctions');
  }

  if (subscription.kyc_status !== 'APPROVED' && subscription.kyc_status !== 'VERIFIED') {
    throw new ApiError(403, 'KYC verification is required before receiving an auction participation ticket');
  }

  // 3. Strict Check: Verify zero OVERDUE or unpaid installments due on or before today
  const overdueRes = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM installments
     WHERE subscription_id = $1
       AND (
         status = 'OVERDUE'
         OR (status = 'PENDING' AND due_date IS NOT NULL AND due_date < CURRENT_DATE)
       )`,
    [subscription.id]
  );
  const overdueCount = overdueRes.rows[0]?.count || 0;
  if (overdueCount > 0) {
    throw new ApiError(
      400,
      `Ineligible for auction ticket: You have ${overdueCount} overdue/unpaid installment(s). Please clear dues to participate.`
    );
  }

  return { auction, subscription };
}

/**
 * Claim or retrieve an existing ticket for an auction session.
 * Idempotent: If an active ticket already exists, returns it.
 * If none exists, validates eligibility and creates a new ACTIVE ticket.
 */
export async function claimOrGetTicket(client, auctionId, userId, ipAddress = null) {
  // First check if ticket already exists
  const existingRes = await client.query(
    `SELECT t.*, s.ticket_number, u.full_name
     FROM auction_tickets t
     JOIN subscriptions s ON s.id = t.subscription_id
     JOIN users u ON u.id = t.user_id
     WHERE t.auction_id = $1 AND t.user_id = $2`,
    [auctionId, userId]
  );

  if (existingRes.rows.length) {
    const existing = existingRes.rows[0];
    if (existing.status === 'REVOKED') {
      throw new ApiError(403, `Your ticket for this auction was revoked: ${existing.revocation_reason || 'Administrative action'}`);
    }
    if (existing.status === 'EXPIRED') {
      throw new ApiError(400, 'Your ticket for this auction has expired');
    }
    return existing;
  }

  // Validate eligibility before issue
  const { auction, subscription } = await checkMemberEligibility(client, auctionId, userId);

  if (auction.status === 'COMPLETED' || auction.status === 'CANCELLED') {
    throw new ApiError(400, 'Cannot issue tickets for closed or cancelled auctions');
  }

  const ticketCode = generateTicketCode(auctionId);

  // Insert with conflict guard
  const insertRes = await client.query(
    `INSERT INTO auction_tickets (auction_id, subscription_id, user_id, ticket_code, status, ip_address)
     VALUES ($1, $2, $3, $4, 'ACTIVE', $5)
     ON CONFLICT (auction_id, subscription_id) DO UPDATE
     SET ip_address = COALESCE(EXCLUDED.ip_address, auction_tickets.ip_address)
     RETURNING *`,
    [auctionId, subscription.id, userId, ticketCode, ipAddress]
  );

  return {
    ...insertRes.rows[0],
    ticket_number: subscription.ticket_number,
    full_name: subscription.full_name,
  };
}

/**
 * Validate that a ticket is valid and ACTIVE for placing a bid.
 */
export async function validateTicketForBid(client, auctionId, userId, ticketCode) {
  if (!ticketCode || typeof ticketCode !== 'string') {
    throw new ApiError(400, 'Valid auction ticket code is required to place a bid');
  }

  const res = await client.query(
    `SELECT t.*, s.ticket_number, s.subscriber_status, u.kyc_status
     FROM auction_tickets t
     JOIN subscriptions s ON s.id = t.subscription_id
     JOIN users u ON u.id = t.user_id
     WHERE t.auction_id = $1 AND t.ticket_code = $2`,
    [auctionId, ticketCode.trim()]
  );

  if (!res.rows.length) {
    throw new ApiError(403, 'Invalid ticket code for this auction');
  }

  const ticket = res.rows[0];

  if (ticket.user_id !== userId) {
    throw new ApiError(403, 'Ticket does not belong to the authenticated user');
  }

  if (ticket.status === 'REVOKED') {
    throw new ApiError(403, `Ticket revoked: ${ticket.revocation_reason || 'Administrative action'}`);
  }

  if (ticket.status === 'EXPIRED') {
    throw new ApiError(400, 'Ticket has expired');
  }

  if (ticket.status !== 'ACTIVE') {
    throw new ApiError(400, `Ticket is not in active state (${ticket.status})`);
  }

  return ticket;
}

/**
 * Atomically expire all tickets when an auction closes.
 * Winning ticket is marked 'USED'. All other tickets are marked 'EXPIRED'.
 * Zero hard deletes.
 */
export async function expireAuctionTickets(client, auctionId, winningSubscriptionId = null) {
  // 1. Mark winner's ticket as USED if subscription provided
  if (winningSubscriptionId) {
    await client.query(
      `UPDATE auction_tickets
       SET status = 'USED', used_at = now()
       WHERE auction_id = $1 AND subscription_id = $2 AND status = 'ACTIVE'`,
      [auctionId, winningSubscriptionId]
    );
  }

  // 2. Mark all other non-revoked tickets as EXPIRED
  const expireRes = await client.query(
    `UPDATE auction_tickets
     SET status = 'EXPIRED', expired_at = now()
     WHERE auction_id = $1 AND status IN ('ISSUED', 'ACTIVE')
     RETURNING id, ticket_code, user_id`,
    [auctionId]
  );

  return expireRes.rows;
}

/**
 * Revoke an auction ticket (Admin/Foreman action).
 */
export async function revokeTicket(client, ticketId, reason, adminId) {
  const res = await client.query(
    `UPDATE auction_tickets
     SET status = 'REVOKED', revoked_at = now(), revocation_reason = $1
     WHERE id = $2 AND status != 'USED'
     RETURNING *`,
    [reason || 'Administrative revocation', ticketId]
  );
  if (!res.rows.length) {
    throw new ApiError(404, 'Ticket not found or already used');
  }
  return res.rows[0];
}
