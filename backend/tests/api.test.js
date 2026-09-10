const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock db module for isolated unit/API testing
jest.mock('../src/db', () => ({
  query: jest.fn(async (text, params) => {
    // Mock user lookup/insert for OTP request
    if (text.includes('INSERT INTO users')) {
      return {
        rows: [
          {
            id: '00000000-0000-0000-0000-000000000001',
            phone: params ? params[0] : '+919876543210',
            role: 'user',
            kyc_status: 'PENDING',
          },
        ],
      };
    }
    if (text.includes('SELECT * FROM users WHERE phone')) {
      return {
        rows: [
          {
            id: '00000000-0000-0000-0000-000000000001',
            phone: params ? params[0] : '+919876543210',
            role: 'user',
            kyc_status: 'VERIFIED',
          },
        ],
      };
    }
    if (text.includes('SUM(chit_amount)')) {
      return {
        rows: [{ total: '500000' }],
      };
    }
    if (text.includes('COUNT(*)')) {
      return {
        rows: [{ count: '5' }],
      };
    }
    if (text.includes('SELECT cg.*')) {
      return {
        rows: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Gold Chit 1 Lakh',
            chit_amount: '100000',
            duration_months: 20,
            status: 'OPEN',
            subscriber_count: '15',
          },
        ],
      };
    }
    return { rows: [] };
  }),
  withTransaction: jest.fn(async (cb) => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
    return cb(mockClient);
  }),
  pool: {
    connect: jest.fn(),
    end: jest.fn(),
  },
}));

const { app } = require('../src/index');
const { calculateDividend, toRupees, toPaise } = require('../src/services/dividend');
const { redis, auctionKey, auctionBidsKey } = require('../src/redis');

describe('Backend Comprehensive Test Suite', () => {
  const jwtSecret = process.env.JWT_SECRET || 'chittech_default_jwt_secret_2026';
  const testUserToken = jwt.sign(
    { userId: '00000000-0000-0000-0000-000000000001', role: 'user', phone: '+919876543210' },
    jwtSecret,
    { expiresIn: '1h' }
  );
  const testAdminToken = jwt.sign(
    { userId: '00000000-0000-0000-0000-000000000002', role: 'admin', phone: '+919999999999' },
    jwtSecret,
    { expiresIn: '1h' }
  );

  describe('1. Health & Server Status', () => {
    test('GET /health returns 200 with status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        success: true,
        data: { status: 'ok' },
      });
    });

    test('GET /api/v1/non-existent-endpoint triggers notFoundHandler (404)', async () => {
      const res = await request(app).get('/api/v1/non-existent-endpoint-12345');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('2. Authentication & Authorization Middleware', () => {
    test('POST /api/v1/auth/otp/request with invalid phone returns 400 validation error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phone: '123' }); // Invalid format

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/v1/auth/otp/request with valid phone creates/finds user and returns dev OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phone: '+919876543210' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBeDefined();
    });

    test('Protected route /api/v1/users/me without Bearer token returns 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Protected route /api/v1/users/me with malformed token returns 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token-string');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('Admin route /api/v1/admin/dashboard rejects regular user with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test('Admin route /api/v1/admin/dashboard allows admin user access', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activeGroups).toBe(5);
      expect(res.body.data.totalAUM).toBe(500000);
    });
  });

  describe('3. Chit Groups & Public Listing', () => {
    test('GET /api/v1/chit-groups returns paginated list of chit groups', async () => {
      const res = await request(app).get('/api/v1/chit-groups');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('4. Validation Middleware', () => {
    test('POST /api/v1/payments/order without valid body returns 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/payments/order')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/v1/payments/order with non-UUID installmentId returns 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/payments/order')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ installmentId: 'non-uuid-string' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Dividend Calculation Engine Precision', () => {
    test('toPaise and toRupees conversion correctness', () => {
      expect(toPaise(100)).toBe(10000);
      expect(toPaise(0.5)).toBe(50);
      expect(toRupees(10000)).toBe(100);
      expect(toRupees(50)).toBe(0.5);
    });

    test('Complex chit distribution calculation', () => {
      const subscribers = [
        { subscriptionId: 's1', ticketNumber: 1, subscriberStatus: 'PS' },
        { subscriptionId: 's2', ticketNumber: 2, subscriberStatus: 'NPS' },
        { subscriptionId: 's3', ticketNumber: 3, subscriberStatus: 'NPS' },
      ];

      const result = calculateDividend({
        chitAmount: 300000,
        winningBidPct: 15,
        foremanCommissionPct: 5,
        policy: 'NON_PRIZED_ONLY',
        subscriptions: subscribers,
        winningSubscriptionId: 's1',
      });

      expect(result.distributablePaise).toBeGreaterThan(0);
      expect(result.perSubscriber.length).toBe(2);
      expect(result.totalDistributedPaise).toBe(result.distributablePaise);
    });
  });

  describe('6. Redis Caching & In-Memory Fallback', () => {
    test('Redis client or in-memory fallback handles get/set operations seamlessly', async () => {
      await redis.set('test_key_123', 'test_value_456');
      const val = await redis.get('test_key_123');
      expect(val).toBe('test_value_456');

      await redis.del('test_key_123');
      const deletedVal = await redis.get('test_key_123');
      expect(deletedVal).toBeNull();
    });

    test('Redis auction keys generate correct namespace strings', () => {
      const aId = 'auction-999';
      expect(auctionKey(aId)).toBe('auction:auction-999:state');
      expect(auctionBidsKey(aId)).toBe('auction:auction-999:bids');
    });
  });
});
