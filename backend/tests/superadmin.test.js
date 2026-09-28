import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

process.env.NODE_ENV = 'test';
process.env.REDIS_URL = '';
process.env.SUPERADMIN_JWT_SECRET = 'test_superadmin_secret_key_12345';
process.env.SUPERADMIN_JWT_EXPIRES = '15m';

const mockAdminId = '77777777-7777-7777-7777-777777777777';
const mockPasswordHash = bcrypt.hashSync('12345678', 10);

jest.unstable_mockModule('../src/db.js', () => ({
  query: jest.fn(async (text, params) => {
    // Superadmin lookup
    if (text.includes('FROM super_admins WHERE email')) {
      if (params && params[0] === 'admin@naveenchit.com') {
        return {
          rows: [
            {
              id: mockAdminId,
              email: 'admin@naveenchit.com',
              password_hash: mockPasswordHash,
              full_name: 'Naveen Chit Super Admin',
              role: 'SUPERADMIN',
              is_active: true,
              must_change_password: true,
              failed_attempts: 0,
              locked_until: null,
            },
          ],
        };
      }
      return { rows: [] };
    }

    if (text.includes('FROM super_admins WHERE id')) {
      return {
        rows: [
          {
            id: mockAdminId,
            email: 'admin@naveenchit.com',
            full_name: 'Naveen Chit Super Admin',
            role: 'SUPERADMIN',
            is_active: true,
            must_change_password: true,
            password_hash: mockPasswordHash,
            created_at: new Date().toISOString(),
          },
        ],
      };
    }

    if (text.includes('INSERT INTO super_admin_sessions')) {
      return { rows: [{ id: 'session-123' }] };
    }

    if (text.includes('FROM super_admin_sessions s')) {
      return {
        rows: [
          {
            id: 'session-123',
            super_admin_id: mockAdminId,
            admin_id: mockAdminId,
            email: 'admin@naveenchit.com',
            full_name: 'Naveen Chit Super Admin',
            role: 'SUPERADMIN',
            is_active: true,
            must_change_password: false,
          },
        ],
      };
    }

    if (text.includes('UPDATE super_admins')) {
      return { rows: [{ id: mockAdminId, email: 'admin@naveenchit.com' }] };
    }

    if (text.includes('SELECT COALESCE(SUM(chit_amount)')) {
      return { rows: [{ total_aum: '1000000' }] };
    }

    if (text.includes('SELECT COALESCE(SUM(amount)')) {
      return { rows: [{ total_collected: '250000' }] };
    }

    if (text.includes('SELECT COUNT(*)::int AS count FROM chit_groups')) {
      return { rows: [{ count: 3 }] };
    }

    if (text.includes('SELECT COUNT(*)::int AS count FROM chit_auctions')) {
      return { rows: [{ count: 1 }] };
    }

    if (text.includes("SELECT COUNT(*)::int AS count FROM users WHERE kyc_status = 'PENDING'")) {
      return { rows: [{ count: 2 }] };
    }

    if (text.includes('SELECT COUNT(*)::int AS count FROM sureties')) {
      return { rows: [{ count: 1 }] };
    }

    if (text.includes("SELECT COUNT(*)::int AS count FROM users WHERE role = 'user'")) {
      return { rows: [{ count: 5 }] };
    }

    if (text.includes('SELECT status, COUNT(*)::int AS count FROM chit_groups')) {
      return { rows: [{ status: 'OPEN', count: 2 }, { status: 'ACTIVE', count: 1 }] };
    }

    if (text.includes('FROM audit_events a')) {
      return {
        rows: [
          {
            id: 'audit-1',
            event_type: 'SUPERADMIN_LOGIN_SUCCESS',
            actor_type: 'SUPERADMIN',
            created_at: new Date().toISOString(),
          },
        ],
      };
    }

    if (text.includes("WHERE ca.status = 'LIVE'")) {
      return { rows: [] };
    }

    if (text.includes("WHERE role = 'admin'")) {
      return {
        rows: [
          {
            id: 'admin-1',
            full_name: 'ChitTech Admin',
            phone: '+919999900000',
            role: 'admin',
            kyc_status: 'APPROVED',
          },
        ],
      };
    }

    if (text.includes('FROM chit_groups cg')) {
      return {
        rows: [
          {
            id: 'grp-1',
            name: 'Prosperity Chit 5L',
            chit_amount: 500000,
            duration_months: 20,
            status: 'OPEN',
            filled_subscribers: 5,
          },
        ],
      };
    }

    if (text.includes('FROM users u') && text.includes("u.role = 'user'")) {
      return {
        rows: [
          {
            id: 'user-1',
            full_name: 'Anitha Kumar',
            phone: '+919999900001',
            role: 'user',
            kyc_status: 'APPROVED',
            tickets_count: 1,
            prized_tickets_count: 0,
          },
        ],
      };
    }

    if (text.includes('FROM sureties s')) {
      return {
        rows: [
          {
            id: 'surety-1',
            status: 'SUBMITTED',
            subscriber_name: 'Anitha Kumar',
            group_name: 'Prosperity Chit 5L',
            chit_amount: 500000,
            winning_bid_pct: 25,
          },
        ],
      };
    }

    if (text.includes('FROM payments p')) {
      return {
        rows: [
          {
            id: 'pay-1',
            amount: 25000,
            status: 'SUCCESS',
            subscriber_name: 'Anitha Kumar',
            razorpay_order_id: 'order_123',
            created_at: new Date(),
          },
        ],
      };
    }

    if (text.includes('FROM ledger_entries l')) {
      return {
        rows: [
          {
            id: 'led-1',
            entry_type: 'INSTALLMENT',
            amount: 25000,
            amount_paise: 2500000,
            created_at: new Date(),
          },
        ],
      };
    }

    if (text.includes('SELECT COUNT(*)::int AS total')) {
      return { rows: [{ total: 1 }] };
    }

    return { rows: [] };
  }),
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue(true),
  },
  withTransaction: jest.fn(async (cb) => {
    return cb({
      query: jest.fn().mockResolvedValue({ rows: [{ id: 'tx-1' }] }),
    });
  }),
  logAuditEvent: jest.fn().mockResolvedValue({ rows: [] }),
}));

// Import express app after mocking db
const { app } = await import('../src/index.js');

describe('Superadmin API Module', () => {
  let superadminToken;

  beforeAll(() => {
    superadminToken = jwt.sign(
      { sub: mockAdminId, email: 'admin@naveenchit.com', role: 'superadmin', aud: 'superadmin' },
      process.env.SUPERADMIN_JWT_SECRET,
      { expiresIn: '15m' }
    );
  });

  describe('Authentication (/api/v1/superadmin/auth)', () => {
    test('POST /login rejects invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/auth/login')
        .send({ email: 'admin@naveenchit.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Invalid email or password/i);
    });

    test('POST /login succeeds with correct password', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/auth/login')
        .send({ email: 'admin@naveenchit.com', password: '12345678' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.admin.email).toBe('admin@naveenchit.com');
    });

    test('GET /me returns profile when authenticated with superadmin token', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/auth/me')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('admin@naveenchit.com');
      expect(res.body.data.role).toBe('SUPERADMIN');
    });

    test('GET /me rejects regular user token or unauthenticated call', async () => {
      const userToken = jwt.sign({ userId: 'u1', role: 'user' }, 'different_secret');
      const res = await request(app)
        .get('/api/v1/superadmin/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(401);
    });

    test('POST /refresh accepts valid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/superadmin/auth/refresh')
        .send({ refreshToken: 'dummy_refresh_token_for_test' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });

  describe('Dashboard Summary (/api/v1/superadmin/dashboard/summary)', () => {
    test('GET /summary returns metrics and trend data', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/dashboard/summary')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalAum).toBe(1000000);
      expect(res.body.data.monthlyTrend).toHaveLength(12);
      expect(res.body.data.groupStatusBreakdown).toBeDefined();
    });
  });

  describe('Management Modules', () => {
    test('GET /foremen returns foremen list', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/foremen')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta.page).toBe(1);
    });

    test('GET /chit-groups returns chit groups list', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/chit-groups')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    test('GET /subscribers returns subscribers list', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/subscribers')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    test('GET /payments returns payments and CSV export', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/payments')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);

      const csvRes = await request(app)
        .get('/api/v1/superadmin/payments?format=csv')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(csvRes.status).toBe(200);
      expect(csvRes.headers['content-type']).toMatch(/text\/csv/);
    });

    test('GET /ledger returns ledger and totals', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/ledger')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta.totalsByEntryType).toBeDefined();
    });

    test('GET /settings returns platform limits and rules', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/settings')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.statutoryMaxDiscountPct).toBe(40);
      expect(res.body.data.foremanCommissionPct).toBe(5);
      expect(res.body.data.gstRatePct).toBe(18);
    });

    test('GET /audit-logs returns tamper-evident activity feed', async () => {
      const res = await request(app)
        .get('/api/v1/superadmin/audit-logs')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });
});
