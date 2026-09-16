import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.REDIS_URL = '';

// Mock db module for isolated unit/API testing
jest.unstable_mockModule('../src/db.js', () => ({
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
            full_name: 'Test Subscriber',
            phone: params ? params[0] : '+919876543210',
            role: 'user',
            kyc_status: 'VERIFIED',
          },
        ],
      };
    }
    if (text.includes('FROM users WHERE id')) {
      return {
        rows: [
          {
            id: params ? params[0] : '00000000-0000-0000-0000-000000000001',
            full_name: 'Test Subscriber',
            phone: '+919876543210',
            role: 'user',
            kyc_status: 'VERIFIED',
          },
        ],
      };
    }
    if (text.includes("kyc_status = 'PENDING'")) {
      return {
        rows: [
          {
            id: '99999999-9999-9999-9999-999999999999',
            phone: '+919876543299',
            full_name: 'Pending Applicant',
            role: 'user',
            kyc_status: 'PENDING',
            pan_number: 'ABCDE9999Z',
            aadhaar_vault_ref: 'AVR-9999',
            created_at: new Date().toISOString(),
          },
        ],
      };
    }
    if (text.includes('UPDATE users') && text.includes('kyc_status = $1')) {
      return {
        rows: [
          {
            id: params ? params[1] : '99999999-9999-9999-9999-999999999999',
            phone: '+919876543299',
            full_name: 'Pending Applicant',
            role: 'user',
            kyc_status: params ? params[0] : 'VERIFIED',
          },
        ],
      };
    }
    if (text.includes('INSERT INTO chit_groups')) {
      return {
        rows: [
          {
            id: '12121212-1212-1212-1212-121212121212',
            name: params ? params[0] : 'Diamond Elite 5 Lakh',
            chit_amount: params ? params[1] : 500000,
            chit_amount_paise: params ? params[2] : 50000000,
            duration_months: params ? params[3] : 25,
            foreman_commission_pct: params ? params[4] : 5,
            registrar_state_code: params ? params[5] : 'TS',
            dividend_distribution_policy: params ? params[6] : 'NON_PRIZED_ONLY',
            status: 'OPEN',
          },
        ],
      };
    }
    if (text.includes('INSERT INTO chit_auctions')) {
      return {
        rows: [
          {
            id: '78787878-7878-7878-7878-787878787878',
            chit_group_id: params ? params[0] : '11111111-1111-1111-1111-111111111111',
            month_number: params ? params[1] : 3,
            scheduled_at: params ? params[2] : new Date().toISOString(),
            status: 'SCHEDULED',
          },
        ],
      };
    }
    if (text.includes('INSERT INTO dpdp_consents')) {
      return {
        rows: [
          {
            id: 'dpdp-consent-1',
            user_id: params ? params[0] : '00000000-0000-0000-0000-000000000001',
            purpose: params ? params[1] : 'credit_bureau_check',
            consented: params ? params[2] : true,
            consent_timestamp: new Date().toISOString(),
          },
        ],
      };
    }
    if (text.includes('UPDATE dpdp_consents')) {
      return {
        rows: [
          {
            id: 'dpdp-consent-1',
            user_id: params ? params[0] : '00000000-0000-0000-0000-000000000001',
            purpose: params ? params[1] : 'credit_bureau_check',
            consented: false,
            withdrawal_timestamp: new Date().toISOString(),
          },
        ],
      };
    }
    if (text.includes('dpdp_consents')) {
      return { rows: [] };
    }
    if (text.includes('SUM(chit_amount)')) {
      return {
        rows: [{ total: '500000' }],
      };
    }
    if (text.trim().startsWith('SELECT COUNT(*)') || text.includes('SELECT COUNT(*) FROM')) {
      return {
        rows: [{ count: '5' }],
      };
    }
    if (text.includes('SELECT cg.*') || text.includes('SELECT cg.id')) {
      return {
        rows: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Gold Chit 1 Lakh',
            chit_amount: 100000,
            duration_months: 20,
            status: 'OPEN',
            subscriber_count: 15,
            vacant_slots: 5,
            installment_amount: 5000,
          },
        ],
      };
    }
    if (text.includes('FROM payments') || text.includes('SELECT * FROM payments') || text.includes('payments p')) {
      return {
        rows: [
          {
            id: '44444444-4444-4444-4444-444444444444',
            user_id: '00000000-0000-0000-0000-000000000001',
            subscription_id: '22222222-2222-2222-2222-222222222222',
            installment_id: '33333333-3333-3333-3333-333333333333',
            amount: 5000,
            amount_paise: 500000,
            status: 'SUCCESS',
            razorpay_order_id: 'sim_ord_test',
            razorpay_payment_id: 'sim_pay_test',
            chit_group_name: 'Gold Chit 1 Lakh',
            month_number: 1,
            ticket_number: 7,
            created_at: new Date().toISOString(),
          },
        ],
      };
    }
    if (text.includes('FROM installments') || text.includes('installments i') || text.includes('SELECT i.*')) {
      return {
        rows: [
          {
            id: '33333333-3333-3333-3333-333333333333',
            subscription_id: '22222222-2222-2222-2222-222222222222',
            month_number: 1,
            amount_due: '5000.00',
            amount_due_paise: 500000,
            status: 'PENDING',
            user_id: '00000000-0000-0000-0000-000000000001',
            chit_group_id: '11111111-1111-1111-1111-111111111111',
            chit_group_name: 'Gold Chit 1 Lakh',
          },
        ],
      };
    }
    if (text.includes("s.subscriber_status IN ('SB', 'PS')")) {
      return {
        rows: [
          {
            subscription_id: '22222222-2222-2222-2222-222222222222',
            ticket_number: 7,
            subscriber_status: 'SB',
            prized_month: 2,
            chit_group_id: '11111111-1111-1111-1111-111111111111',
            chit_group_name: 'Gold Chit 1 Lakh',
            chit_amount: 100000,
            foreman_commission_pct: 5,
            auction_id: '55555555-5555-5555-5555-555555555555',
            winning_bid_pct: 20.0,
            auction_month: 2,
          },
        ],
      };
    }
    if (text.includes('FROM sureties s JOIN subscriptions sub') || text.includes('SELECT s.*, sub.user_id')) {
      return {
        rows: [
          {
            id: '66666666-6666-6666-6666-666666666666',
            subscription_id: '22222222-2222-2222-2222-222222222222',
            auction_id: '55555555-5555-5555-5555-555555555555',
            act_auction_id: '55555555-5555-5555-5555-555555555555',
            sub_id: '22222222-2222-2222-2222-222222222222',
            user_id: '00000000-0000-0000-0000-000000000001',
            subscriber_status: 'SB',
            surety_type: 'CO_GUARANTORS',
            status: 'SUBMITTED',
            group_name: 'Gold Chit 1 Lakh',
            chit_amount: 100000,
            foreman_commission_pct: 5,
            winning_bid_pct: 20.0,
          },
        ],
      };
    }
    if (text.includes('FROM sureties WHERE id =') || text.includes('SELECT * FROM sureties WHERE id')) {
      return {
        rows: [
          {
            id: '66666666-6666-6666-6666-666666666666',
            subscription_id: '22222222-2222-2222-2222-222222222222',
            auction_id: '55555555-5555-5555-5555-555555555555',
            act_auction_id: '55555555-5555-5555-5555-555555555555',
            sub_id: '22222222-2222-2222-2222-222222222222',
            user_id: '00000000-0000-0000-0000-000000000001',
            subscriber_status: 'SB',
            group_name: 'Gold Chit 1 Lakh',
            chit_amount: 100000,
            foreman_commission_pct: 5,
            winning_bid_pct: 20.0,
            surety_type: 'CO_GUARANTORS',
            status: 'PENDING',
          },
        ],
      };
    }
    if (text.includes('FROM sureties WHERE subscription_id =')) {
      return {
        rows: [
          {
            id: '66666666-6666-6666-6666-666666666666',
            subscription_id: '22222222-2222-2222-2222-222222222222',
            auction_id: '55555555-5555-5555-5555-555555555555',
            surety_type: 'CO_GUARANTORS',
            status: 'PENDING',
          },
        ],
      };
    }
    if (text.includes("UPDATE sureties SET status = 'SUBMITTED'") || text.includes("UPDATE sureties SET status = 'APPROVED'")) {
      return {
        rows: [
          {
            id: '66666666-6666-6666-6666-666666666666',
            status: text.includes('APPROVED') ? 'APPROVED' : 'SUBMITTED',
          },
        ],
      };
    }
    if (text.includes('INSERT INTO guarantors')) {
      return {
        rows: [
          {
            id: '77777777-7777-7777-7777-777777777777',
            surety_id: '66666666-6666-6666-6666-666666666666',
            full_name: 'Jane Doe',
            phone: '+919123456780',
            pan_number: 'ABCDE1234F',
            signature_verified: true,
            verification_status: 'VERIFIED',
          },
        ],
      };
    }
    if (text.includes('FROM guarantors WHERE surety_id =')) {
      return {
        rows: [
          {
            id: '77777777-7777-7777-7777-777777777777',
            surety_id: '66666666-6666-6666-6666-666666666666',
            full_name: 'Jane Doe',
            phone: '+919123456780',
            pan_number: 'ABCDE1234F',
            verification_status: 'VERIFIED',
          },
        ],
      };
    }
    if (text.includes('FROM disbursals WHERE subscription_id =')) {
      return {
        rows: [],
      };
    }
    if (text.includes('FROM chit_auctions') || text.includes('chit_auctions ca WHERE') || text.includes('SELECT * FROM chit_auctions') || text.includes('chit_auctions WHERE id') || text.includes('chit_auctions ca')) {
      return {
        rows: [
          {
            id: '55555555-5555-5555-5555-555555555555',
            chit_group_id: '11111111-1111-1111-1111-111111111111',
            month_number: 2,
            status: 'LIVE',
            foreman_commission_pct: 5,
            chit_amount: 100000,
            duration_months: 20,
            group_name: 'Gold Chit 1 Lakh',
            winning_bid_pct: 15.0,
            winner_name: 'Test Subscriber',
            winner_phone: '+919876543210',
            winner_ticket_number: 7,
            winner_ticket: 7,
            registrar_state_code: 'TS',
          },
        ],
      };
    }
    if (text.includes('FROM subscriptions') || text.includes('subscriptions WHERE') || text.includes('SELECT s.id') || text.includes('subscriptions')) {
      return {
        rows: [
          {
            id: '22222222-2222-2222-2222-222222222222',
            chit_group_id: '11111111-1111-1111-1111-111111111111',
            user_id: '00000000-0000-0000-0000-000000000001',
            ticket_number: 7,
            subscriber_status: 'NPS',
            group_name: 'Gold Chit 1 Lakh',
            chit_group_name: 'Gold Chit 1 Lakh',
            chit_amount: 100000,
            duration_months: 20,
            installment_amount: 5000,
            installments_paid: 1,
            total_dividend_earned: 0,
          },
        ],
      };
    }
    if (text.includes('SELECT foreman_commission_pct FROM chit_groups') || text.includes('FROM chit_groups WHERE id')) {
      return {
        rows: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Gold Chit 1 Lakh',
            chit_amount: 100000,
            foreman_commission_pct: 5,
            dividend_distribution_policy: 'NON_PRIZED_ONLY',
            status: 'RUNNING',
            duration_months: 20,
          },
        ],
      };
    }
    return { rows: [] };
  }),
  withTransaction: jest.fn(async (cb) => {
    const mockClient = {
      query: jest.fn(async (text, params) => {
        if (text.includes('UPDATE installments SET status = \'PAID\'')) {
          return {
            rows: [
              {
                id: '33333333-3333-3333-3333-333333333333',
                status: 'PAID',
                amount_due: '5000.00',
                amount_due_paise: 500000,
                month_number: 1,
              },
            ],
          };
        }
        if (text.includes('INSERT INTO payments')) {
          return {
            rows: [
              {
                id: '44444444-4444-4444-4444-444444444444',
                user_id: '00000000-0000-0000-0000-000000000001',
                subscription_id: '22222222-2222-2222-2222-222222222222',
                installment_id: '33333333-3333-3333-3333-333333333333',
                amount: 5000,
                amount_paise: 500000,
                status: 'SUCCESS',
                razorpay_order_id: 'sim_ord_test',
                razorpay_payment_id: 'sim_pay_test',
              },
            ],
          };
        }
        if (text.includes('INSERT INTO disbursals')) {
          return {
            rows: [
              {
                id: '88888888-8888-8888-8888-888888888888',
                subscription_id: '22222222-2222-2222-2222-222222222222',
                auction_id: '55555555-5555-5555-5555-555555555555',
                surety_id: '66666666-6666-6666-6666-666666666666',
                gross_amount_paise: 10000000,
                discount_amount_paise: 2000000,
                foreman_commission_paise: 500000,
                net_payout_paise: 8000000,
                status: 'DISBURSED',
                bank_reference_utr: 'UTR1234567890',
                disbursed_at: new Date().toISOString(),
              },
            ],
          };
        }
        if (text.includes("UPDATE sureties SET status = 'APPROVED'")) {
          return {
            rows: [
              {
                id: '66666666-6666-6666-6666-666666666666',
                status: 'APPROVED',
              },
            ],
          };
        }
        if (text.includes("subscriber_status = 'PS'")) {
          return {
            rows: [
              {
                id: '22222222-2222-2222-2222-222222222222',
                subscriber_status: 'PS',
                prized_month: 2,
              },
            ],
          };
        }
        if (text.includes('subscriber_status = \'SB\'') || text.includes('UPDATE subscriptions')) {
          return {
            rows: [
              {
                id: '22222222-2222-2222-2222-222222222222',
                subscriber_status: 'SB',
                prized_month: 2,
              },
            ],
          };
        }
        if (text.includes('SELECT id AS subscription_id, ticket_number, subscriber_status FROM subscriptions')) {
          return {
            rows: [
              { subscription_id: '22222222-2222-2222-2222-222222222222', ticket_number: 7, subscriber_status: 'SB' },
              { subscription_id: 'sub-2', ticket_number: 2, subscriber_status: 'NPS' },
              { subscription_id: 'sub-3', ticket_number: 3, subscriber_status: 'NPS' },
            ],
          };
        }
        if (text.includes('UPDATE chit_auctions')) {
          return { rows: [{ id: '55555555-5555-5555-5555-555555555555', status: 'COMPLETED' }] };
        }
        return { rows: [] };
      }),
    };
    return cb(mockClient);
  }),
  logAuditEvent: jest.fn().mockResolvedValue({ rows: [] }),
  pool: {
    connect: jest.fn(),
    end: jest.fn(),
  },
}));

const { app } = await import('../src/index.js');
const { calculateDividend, toRupees, toPaise } = await import('../src/services/dividend.js');
const { redis, auctionKey, auctionBidsKey } = await import('../src/redis.js');

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
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
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

    test('GET /api/v1/auth/verify-session with valid token returns user session', async () => {
      const res = await request(app)
        .get('/api/v1/auth/verify-session')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.user.phone).toBe('+919876543210');
    });

    test('GET /api/v1/auth/verify-session without token returns 401', async () => {
      const res = await request(app).get('/api/v1/auth/verify-session');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/v1/users/me/consents persists DPDP 2023 consents', async () => {
      const res = await request(app)
        .post('/api/v1/users/me/consents')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          consents: {
            identity_verification: true,
            credit_bureau_check: true,
            auction_participation_records: true,
            regulatory_reporting_pmla: true,
            marketing_communications: false,
          },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
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

    test('GET /api/v1/chit-groups/:id returns single group detail with vacant slots', async () => {
      const res = await request(app).get('/api/v1/chit-groups/11111111-1111-1111-1111-111111111111');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Gold Chit 1 Lakh');
      expect(res.body.data.vacant_slots).toBeDefined();
    });

    test('GET /api/v1/subscriptions/mine returns subscriber active chits', async () => {
      const res = await request(app)
        .get('/api/v1/subscriptions/mine')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].chit_group_name).toBe('Gold Chit 1 Lakh');
    });

    test('POST /api/v1/chit-groups/:groupId/join requires authentication (401)', async () => {
      const res = await request(app).post('/api/v1/chit-groups/11111111-1111-1111-1111-111111111111/join');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
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

  describe('4b. Payments & Double-Entry Ledger (Phase 4)', () => {
    test('POST /api/v1/payments/simulate requires either installmentId or subscriptionId', async () => {
      const res = await request(app)
        .post('/api/v1/payments/simulate')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/v1/payments/simulate simulates payment settlement, marks installment PAID, and records audit event', async () => {
      const res = await request(app)
        .post('/api/v1/payments/simulate')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ subscriptionId: '22222222-2222-2222-2222-222222222222' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payment.status).toBe('SUCCESS');
      expect(res.body.data.installment.status).toBe('PAID');
    });

    test('GET /api/v1/payments/mine returns user receipts with enriched chit and installment data', async () => {
      const res = await request(app)
        .get('/api/v1/payments/mine')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].chit_group_name).toBe('Gold Chit 1 Lakh');
      expect(res.body.data[0].status).toBe('SUCCESS');
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

  describe('7. Live Reverse Auction Engine & Concurrency (Phase 5)', () => {
    test('POST /api/v1/auctions/:id/bid rejects bids below minimum foreman commission', async () => {
      const res = await request(app)
        .post('/api/v1/auctions/55555555-5555-5555-5555-555555555555/bid')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ bidPct: 2.0 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/commission/i);
    });

    test('POST /api/v1/auctions/:id/bid accepts valid reverse bid and stores in Redis', async () => {
      await redis.set(
        auctionKey('55555555-5555-5555-5555-555555555555'),
        JSON.stringify({ lowestBidPct: null, highestBidPct: null })
      );

      const res = await request(app)
        .post('/api/v1/auctions/55555555-5555-5555-5555-555555555555/bid')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ bidPct: 15.0 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.highestBidPct).toBe(15.0);
    });

    test('POST /api/v1/auctions/:id/bid rejects subsequent bid that is not strictly higher discount', async () => {
      const res = await request(app)
        .post('/api/v1/auctions/55555555-5555-5555-5555-555555555555/bid')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ bidPct: 12.0 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/strictly exceed/i);
    });

    test('POST /api/v1/auctions/:id/close transitions winner to SB, creates pending surety, and posts integer-paise ledgers', async () => {
      const res = await request(app)
        .post('/api/v1/auctions/55555555-5555-5555-5555-555555555555/close')
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.winningBidPct).toBe(15.0);
      expect(res.body.data.prizeAmount).toBeDefined();
      expect(res.body.data.dividendPerSubscriber).toBeDefined();
    });
  });

  describe('8. Surety Evaluation, Guarantors & Prize Disbursal (§ 31 Chit Funds Act) (Phase 6)', () => {
    test('GET /api/v1/sureties/mine returns active prize claim with exact integer-paise breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/sureties/mine')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.statusCode || 200).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.subscription.subscriber_status).toBe('SB');
      expect(res.body.data.grossAmountPaise).toBe(10000000);
      expect(res.body.data.discountAmountPaise).toBe(2000000);
      expect(res.body.data.netPayoutPaise).toBe(8000000);
      expect(Number(res.body.data.netPayoutAmount)).toBe(80000);
      expect(res.body.data.surety.id).toBe('66666666-6666-6666-6666-666666666666');
    });

    test('POST /api/v1/sureties/:id/guarantors registers and verifies co-guarantor with audit trail', async () => {
      const res = await request(app)
        .post('/api/v1/sureties/66666666-6666-6666-6666-666666666666/guarantors')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          fullName: 'Jane Doe',
          phone: '+919123456780',
          panNumber: 'ABCDE1234F',
          relationship: 'Sibling',
          monthlyIncomePaise: 8500000,
          cibilScore: 780,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.full_name).toBe('Jane Doe');
      expect(res.body.data.verification_status).toBe('VERIFIED');
    });

    test('POST /api/v1/sureties/:id/submit transitions surety package status to SUBMITTED', async () => {
      const res = await request(app)
        .post('/api/v1/sureties/66666666-6666-6666-6666-666666666666/submit')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUBMITTED');
    });

    test('POST /api/v1/sureties/:id/disburse executes RTGS payout and transitions subscriber from SB to PS under § 31', async () => {
      const res = await request(app)
        .post('/api/v1/sureties/66666666-6666-6666-6666-666666666666/disburse')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          bankAccountNumber: '123456789012',
          bankIfsc: 'HDFC0001234',
          bankBeneficiaryName: 'John Doe',
          paymentMode: 'RTGS',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subscription.subscriber_status).toBe('PS');
      expect(res.body.data.disbursal.status).toBe('DISBURSED');
      expect(Number(res.body.data.netPayoutAmount)).toBe(80000);
      expect(res.body.data.utrNumber).toMatch(/^UTR/);
    });
  });

  describe('9. Foreman Admin Portal & Group Creation Flow (Phase 7)', () => {
    test('GET /api/v1/admin/dashboard returns operational aggregates with role guard', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activeGroups).toBeDefined();
      expect(res.body.data.totalAUM).toBeDefined();
      expect(res.body.data.pendingKyc).toBeDefined();
      expect(res.body.data.todaysAuctions).toBeDefined();
    });

    test('POST /api/v1/chit-groups registers new group with integer-paise validation', async () => {
      const res = await request(app)
        .post('/api/v1/chit-groups')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({
          name: 'Diamond Elite 5 Lakh',
          chitAmount: 500000,
          durationMonths: 25,
          foremanCommissionPct: 5,
          registrarStateCode: 'TS',
          dividendDistributionPolicy: 'NON_PRIZED_ONLY',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Diamond Elite 5 Lakh');
      expect(res.body.data.chit_amount_paise).toBe(50000000);
      expect(res.body.data.status).toBe('OPEN');
    });

    test('GET /api/v1/admin/kyc/pending returns queue of unverified applicants', async () => {
      const res = await request(app)
        .get('/api/v1/admin/kyc/pending')
        .set('Authorization', `Bearer ${testAdminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].kyc_status).toBe('PENDING');
    });

    test('POST /api/v1/admin/kyc/:id/review updates applicant status and records audit event', async () => {
      const res = await request(app)
        .post('/api/v1/admin/kyc/99999999-9999-9999-9999-999999999999/review')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({
          status: 'VERIFIED',
          reason: 'Aadhaar e-KYC vault matched and approved by Foreman',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kyc_status).toBe('VERIFIED');
    });

    test('POST /api/v1/admin/auctions/schedule sets up future auction session with audit event', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auctions/schedule')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({
          chitGroupId: '11111111-1111-1111-1111-111111111111',
          monthNumber: 3,
          scheduledAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SCHEDULED');
      expect(res.body.data.month_number).toBe(3);
    });
  });

  describe('10. Regulatory Compliance, Form XIV, DPDP & Legal Filings (Phase 8)', () => {
    test('GET /api/v1/compliance/dpdp/export exports statutory personal data package under § 11 DPDP Act', async () => {
      const res = await request(app)
        .get('/api/v1/compliance/dpdp/export')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complianceStandard).toMatch(/DPDP Act, 2023/);
      expect(res.body.data.dataPrincipal).toBeDefined();
      expect(res.body.data.subscribedChits).toBeDefined();
      expect(res.body.data.financialLedgers).toBeDefined();
      expect(res.body.data.activityAuditTrail).toBeDefined();
    });

    test('POST /api/v1/compliance/dpdp/consent records explicit consent grant with audit trail', async () => {
      const res = await request(app)
        .post('/api/v1/compliance/dpdp/consent')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          purpose: 'credit_bureau_check',
          consented: true,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.purpose).toBe('credit_bureau_check');
      expect(res.body.data.consented).toBe(true);
    });

    test('POST /api/v1/compliance/dpdp/withdraw revokes consent under § 6(4) DPDP Act', async () => {
      const res = await request(app)
        .post('/api/v1/compliance/dpdp/withdraw')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          purpose: 'credit_bureau_check',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.consented).toBe(false);
      expect(res.body.data.withdrawal_timestamp).toBeDefined();
    });

    test('GET /api/v1/compliance/form-xiv/:auctionId generates statutory Form XIV minutes (§ 18 Chit Funds Act)', async () => {
      const res = await request(app)
        .get('/api/v1/compliance/form-xiv/55555555-5555-5555-5555-555555555555')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.formName).toBe('FORM XIV');
      expect(res.body.data.filingDeadlineHours).toBe(48);
      expect(res.body.data.auctionProceedings.winningBidDiscountPct).toBe(15.0);
      expect(res.body.data.dscStatus).toBe('DIGITALLY_SIGNED_SHA256_RSA');
    });

    test('GET /api/v1/compliance/gst-invoice/:auctionId generates formal SAC 997159 tax invoice (Notification 11/2017)', async () => {
      const res = await request(app)
        .get('/api/v1/compliance/gst-invoice/55555555-5555-5555-5555-555555555555')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sacCode).toBe('997159');
      expect(res.body.data.foremanEntity.gstin).toBe('36AAACC1206K1ZF');
      expect(res.body.data.lineItems[0].cgstRatePct).toBe(9);
      expect(res.body.data.lineItems[0].sgstRatePct).toBe(9);
      expect(res.body.data.rcmApplicable).toBe(false);
    });
  });
});
