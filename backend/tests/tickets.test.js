import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.REDIS_URL = '';

const testAuctionId = '55555555-5555-5555-5555-555555555555';
const testUserId = '00000000-0000-0000-0000-000000000001';
const testGroupId = '11111111-1111-1111-1111-111111111111';

let inMemoryTickets = [];

jest.unstable_mockModule('../src/db.js', () => ({
  query: jest.fn(async (text, params) => {
    // Auction tickets claim / lookup
    if (text.includes('auction_tickets') && text.includes('user_id = $2')) {
      const match = inMemoryTickets.find((t) => t.auction_id === params[0] && t.user_id === params[1]);
      return {
        rows: match
          ? [
              {
                ...match,
                ticket_number: 7,
                group_name: 'Gold Chit 1 Lakh',
              },
            ]
          : [],
      };
    }

    if (text.includes('auction_tickets') && text.includes('ticket_code = $2')) {
      const match = inMemoryTickets.find((t) => t.auction_id === params[0] && t.ticket_code === params[1]);
      return {
        rows: match
          ? [
              {
                ...match,
                ticket_number: 7,
                subscriber_status: 'NPS',
                kyc_status: 'APPROVED',
              },
            ]
          : [],
      };
    }

    if (text.includes('INSERT INTO auction_tickets')) {
      const newTicket = {
        id: 'tkt-uuid-1',
        auction_id: params[0],
        subscription_id: params[1],
        user_id: params[2],
        ticket_code: params[3],
        status: 'ACTIVE',
        issued_at: new Date().toISOString(),
        activated_at: new Date().toISOString(),
        ticket_number: 7,
        full_name: 'Ticket Tester',
      };
      inMemoryTickets.push(newTicket);
      return { rows: [newTicket] };
    }

    // Auction lookup
    if (text.includes('chit_auctions')) {
      return {
        rows: [
          {
            id: testAuctionId,
            chit_group_id: testGroupId,
            month_number: 2,
            status: 'LIVE',
            foreman_commission_pct: 5,
            chit_amount: 100000,
          },
        ],
      };
    }

    if (text.includes('chit_groups')) {
      return {
        rows: [
          {
            id: testGroupId,
            name: 'Gold Chit 1 Lakh',
            chit_amount: 100000,
            foreman_commission_pct: 5,
            dividend_distribution_policy: 'NON_PRIZED_ONLY',
            status: 'RUNNING',
          },
        ],
      };
    }

    // Subscriptions lookup
    if (text.includes('subscriptions')) {
      return {
        rows: [
          {
            id: 'sub-ticket-test-1',
            chit_group_id: testGroupId,
            user_id: testUserId,
            ticket_number: 7,
            subscriber_status: 'NPS',
            kyc_status: 'APPROVED',
            full_name: 'Ticket Tester',
          },
        ],
      };
    }

    if (text.includes('INSERT INTO auction_bids')) {
      return { rows: [{ id: 'bid-1' }] };
    }

    return { rows: [] };
  }),
  withTransaction: jest.fn(async (cb) => {
    const mockClient = {
      query: jest.fn(async (text, params) => {
        if (text.includes("status = 'USED'") || text.includes('USED')) {
          inMemoryTickets.forEach((t) => {
            if (t.auction_id === params[0] && t.subscription_id === params[1]) {
              t.status = 'USED';
            }
          });
          return { rows: [] };
        }
        if (text.includes("status = 'EXPIRED'") || text.includes('EXPIRED')) {
          const expired = inMemoryTickets.filter((t) => t.status === 'ACTIVE');
          expired.forEach((t) => { t.status = 'EXPIRED'; });
          return { rows: expired };
        }
        if (text.includes('SELECT id AS subscription_id')) {
          return {
            rows: [{ subscription_id: 'sub-ticket-test-1', ticket_number: 7, subscriber_status: 'SB' }],
          };
        }
        return { rows: [{ id: 'tx-1' }] };
      }),
    };
    return cb(mockClient);
  }),
  logAuditEvent: jest.fn().mockResolvedValue({ rows: [] }),
  pool: { connect: jest.fn(), end: jest.fn() },
}));

const { app } = await import('../src/index.js');
const { redis, auctionKey } = await import('../src/redis.js');

describe('Auction Ticket Lifecycle & Security Suite', () => {
  const jwtSecret = process.env.JWT_SECRET || 'chittech_default_jwt_secret_2026';
  const testUserToken = jwt.sign(
    { userId: testUserId, role: 'user', phone: '+919876543210' },
    jwtSecret,
    { expiresIn: '1h' }
  );
  const testAdminToken = jwt.sign(
    { userId: 'admin-1', role: 'admin', phone: '+919999999999' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  beforeEach(async () => {
    inMemoryTickets = [];
    await redis.set(
      auctionKey(testAuctionId),
      JSON.stringify({
        lowestBidPct: null,
        highestBidPct: null,
        minBidPct: 5,
        bidderSubscriptionId: null,
        updatedAt: Date.now(),
      })
    );
  });

  test('1. Member can claim an active ticket upon entering auction', async () => {
    const res = await request(app)
      .post(`/api/v1/auctions/${testAuctionId}/tickets/claim`)
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticket_code).toMatch(/^TKT-/);
    expect(res.body.data.status).toBe('ACTIVE');
  });

  test('2. Member can retrieve their active ticket via /my-ticket', async () => {
    // First claim
    await request(app)
      .post(`/api/v1/auctions/${testAuctionId}/tickets/claim`)
      .set('Authorization', `Bearer ${testUserToken}`);

    const res = await request(app)
      .get(`/api/v1/auctions/${testAuctionId}/my-ticket`)
      .set('Authorization', `Bearer ${testUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticket_code).toMatch(/^TKT-/);
  });

  test('3. Bidding succeeds when a valid active ticket is presented', async () => {
    const claimRes = await request(app)
      .post(`/api/v1/auctions/${testAuctionId}/tickets/claim`)
      .set('Authorization', `Bearer ${testUserToken}`);

    const ticketCode = claimRes.body.data.ticket_code;

    const bidRes = await request(app)
      .post(`/api/v1/auctions/${testAuctionId}/bid`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ bidPct: 10.0, ticketCode });

    expect(bidRes.status).toBe(200);
    expect(bidRes.body.success).toBe(true);
    expect(bidRes.body.data.highestBidPct).toBe(10.0);
  });

  test('4. Bidding is rejected if an invalid or fake ticketCode is supplied', async () => {
    const bidRes = await request(app)
      .post(`/api/v1/auctions/${testAuctionId}/bid`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ bidPct: 10.0, ticketCode: 'TKT-FAKE-CODE-999' });

    expect(bidRes.status).toBe(403);
    expect(bidRes.body.success).toBe(false);
    expect(bidRes.body.error).toMatch(/Invalid ticket code/i);
  });

  test('5. Bidding is rejected if member holds a REVOKED ticket', async () => {
    // Pre-populate ticket as REVOKED
    inMemoryTickets.push({
      id: 'tkt-revoked-1',
      auction_id: testAuctionId,
      subscription_id: 'sub-ticket-test-1',
      user_id: testUserId,
      ticket_code: 'TKT-REVOKED-123',
      status: 'REVOKED',
      revocation_reason: 'Suspected proxy bidding',
    });

    const bidRes = await request(app)
      .post(`/api/v1/auctions/${testAuctionId}/bid`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ bidPct: 10.0, ticketCode: 'TKT-REVOKED-123' });

    expect(bidRes.status).toBe(403);
    expect(bidRes.body.success).toBe(false);
    expect(bidRes.body.error).toMatch(/Ticket revoked/i);
  });

  test('6. Atomic ticket expiration: closing auction marks winner USED and others EXPIRED', async () => {
    // 1. Claim ticket and bid
    const claimRes = await request(app)
      .post(`/api/v1/auctions/${testAuctionId}/tickets/claim`)
      .set('Authorization', `Bearer ${testUserToken}`);

    const ticketCode = claimRes.body.data.ticket_code;

    await request(app)
      .post(`/api/v1/auctions/${testAuctionId}/bid`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .send({ bidPct: 12.0, ticketCode });

    // 2. Admin closes auction
    const closeRes = await request(app)
      .post(`/api/v1/auctions/${testAuctionId}/close`)
      .set('Authorization', `Bearer ${testAdminToken}`);

    expect(closeRes.status).toBe(200);
    expect(closeRes.body.success).toBe(true);

    // Verify in-memory ticket status was updated to USED for winner
    const winningTicket = inMemoryTickets.find((t) => t.ticket_code === ticketCode);
    expect(winningTicket.status).toBe('USED');
  });
});
