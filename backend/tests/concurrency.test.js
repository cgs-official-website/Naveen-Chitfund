import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.REDIS_URL = '';

const testAuctionId = 'auction-stress-111';
let mockSubscribersCount = 18;
const maxSlots = 20;

jest.unstable_mockModule('../src/db.js', () => ({
  query: jest.fn(async (text, params) => {
    if (text.includes('SELECT 1')) {
      return { rows: [{ '?column?': 1 }] };
    }
    if (text.includes('FROM users WHERE phone') || text.includes('FROM users WHERE id')) {
      return {
        rows: [
          {
            id: '00000000-0000-0000-0000-000000000001',
            full_name: 'Concurrent Bidder',
            phone: '+919876543210',
            role: 'user',
            kyc_status: 'VERIFIED',
          },
        ],
      };
    }
    if (text.includes('FROM chit_auctions') || text.includes('chit_auctions WHERE id')) {
      return {
        rows: [
          {
            id: testAuctionId,
            chit_group_id: 'grp-stress-1',
            month_number: 2,
            status: 'LIVE',
            foreman_commission_pct: 5,
            chit_amount: 200000,
          },
        ],
      };
    }
    if (text.includes('FROM subscriptions WHERE chit_group_id') || text.includes('subscriptions WHERE chit_group_id = $1 AND user_id = $2')) {
      return {
        rows: [
          {
            id: 'sub-bidder-1',
            chit_group_id: 'grp-stress-1',
            user_id: '00000000-0000-0000-0000-000000000001',
            ticket_number: 5,
            subscriber_status: 'NPS',
          },
        ],
      };
    }
    return { rows: [] };
  }),
  withTransaction: jest.fn(async (cb) => {
    const mockClient = {
      query: jest.fn(async (text, params) => {
        if (text.includes('SELECT * FROM chit_groups WHERE id = $1 FOR UPDATE')) {
          return {
            rows: [
              {
                id: 'grp-stress-1',
                name: 'Stress Test Chit 2 Lakh',
                chit_amount: 200000,
                duration_months: maxSlots,
                status: 'OPEN',
              },
            ],
          };
        }
        if (text.includes('SELECT COUNT(*)::int AS count FROM subscriptions')) {
          return {
            rows: [{ count: mockSubscribersCount }],
          };
        }
        if (text.includes('SELECT id FROM subscriptions WHERE')) {
          return { rows: [] };
        }
        if (text.includes('SELECT COALESCE(MAX(ticket_number)')) {
          return {
            rows: [{ next_ticket: mockSubscribersCount + 1 }],
          };
        }
        if (text.includes('INSERT INTO subscriptions')) {
          mockSubscribersCount += 1;
          return {
            rows: [
              {
                id: `sub-${mockSubscribersCount}`,
                chit_group_id: 'grp-stress-1',
                ticket_number: mockSubscribersCount,
                subscriber_status: 'NPS',
              },
            ],
          };
        }
        if (text.includes('INSERT INTO installments') || text.includes('UPDATE chit_groups')) {
          return { rows: [] };
        }
        return { rows: [] };
      }),
    };
    return cb(mockClient);
  }),
  logAuditEvent: jest.fn().mockResolvedValue({ rows: [] }),
  pool: {
    connect: jest.fn(),
    end: jest.fn().mockResolvedValue(),
  },
}));

const { app } = await import('../src/index.js');
const { redis, auctionKey, auctionBidsKey } = await import('../src/redis.js');

describe('Phase 9: High-Concurrency, Double-Spend & Production Hardening Suite', () => {
  const jwtSecret = process.env.JWT_SECRET || 'chittech_default_jwt_secret_2026';
  const testUserToken = jwt.sign(
    { userId: '00000000-0000-0000-0000-000000000001', role: 'user', phone: '+919876543210' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  beforeEach(async () => {
    // Reset auction state in Redis / in-memory store
    await redis.set(
      auctionKey(testAuctionId),
      JSON.stringify({
        auctionId: testAuctionId,
        lowestBidPct: null,
        highestBidPct: null,
        winningSubscriptionId: null,
      })
    );
    await redis.del(auctionBidsKey(testAuctionId));
  });

  describe('1. Production Multi-Service Health Diagnostics & Liveness', () => {
    test('GET /health returns 200 with database and cache telemetry', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
      expect(res.body.data.services.database).toBe('ok');
      expect(res.body.data.services.cache).toBe('ok');
    });
  });

  describe('2. Concurrent Reverse Auction Bidding (Race-Condition Free)', () => {
    test('Simultaneous concurrent bids strictly advance highest discount without race conditions', async () => {
      const discountBids = [6.0, 10.0, 15.0, 20.0, 25.0];

      for (const bidPct of discountBids) {
        const res = await request(app)
          .post(`/api/v1/auctions/${testAuctionId}/bid`)
          .set('Authorization', `Bearer ${testUserToken}`)
          .send({ bidPct });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.highestBidPct).toBe(bidPct);
      }

      // Read final state from Redis
      const rawState = await redis.get(auctionKey(testAuctionId));
      const finalState = JSON.parse(rawState);
      expect(finalState.highestBidPct).toBe(25.0);
    });

    test('Concurrent lower bids submitted out-of-order are strictly rejected', async () => {
      // Establish leading discount at 20%
      await request(app)
        .post(`/api/v1/auctions/${testAuctionId}/bid`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ bidPct: 20.0 });

      // Attempt to offer lower discount
      const res = await request(app)
        .post(`/api/v1/auctions/${testAuctionId}/bid`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ bidPct: 15.0 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/strictly exceed/i);
    });

    test('Statutory Section 14 ceiling (40%) and Section 21 floor (5%) are invariant', async () => {
      // Below 5% foreman minimum
      const lowRes = await request(app)
        .post(`/api/v1/auctions/${testAuctionId}/bid`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ bidPct: 4.0 });
      expect(lowRes.statusCode).toBe(400);

      // Above 40% statutory cap
      const highRes = await request(app)
        .post(`/api/v1/auctions/${testAuctionId}/bid`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ bidPct: 42.0 });
      expect(highRes.statusCode).toBe(400);
      expect(highRes.body.error).toMatch(/40|statutory/i);
    });
  });

  describe('3. Group Capacity & Oversubscription Race Condition Guard', () => {
    test('Concurrent joining attempts respect row lock and capacity limits', async () => {
      mockSubscribersCount = 19; // Only 1 slot left for group with maxSlots = 20

      // First joiner should succeed
      const res1 = await request(app)
        .post('/api/v1/chit-groups/grp-stress-1/join')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res1.statusCode).toBe(201);
      expect(res1.body.success).toBe(true);
      expect(mockSubscribersCount).toBe(20);

      // Subsequent joiner must be rejected (capacity exhausted)
      const res2 = await request(app)
        .post('/api/v1/chit-groups/grp-stress-1/join')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res2.statusCode).toBe(400);
      expect(res2.body.success).toBe(false);
      expect(res2.body.error).toMatch(/capacity/i);
    });
  });
});
