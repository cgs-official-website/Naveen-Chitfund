import { jest, describe, it, expect, beforeEach } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.REDIS_URL = '';

const mockAuctionId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const mockGroupId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const mockSubWinnerId = 'sub-uuid-winner-1';
const mockSubOtherId = 'sub-uuid-other-2';

// In-memory mock database state
let mockAuction;
let mockGroup;
let mockSubscriptions;
let mockLedgerEntries;
let mockSureties;
let mockTickets;
let mockAuditLogs;

jest.unstable_mockModule('../src/db.js', () => ({
  query: jest.fn(async (text, params) => {
    // 1. Expired auctions check (from auctionTimerService)
    if (text.includes('started_at IS NOT NULL')) {
      if (mockAuction && mockAuction.status === 'LIVE') {
        const started = new Date(mockAuction.started_at).getTime();
        const durationSec = mockAuction.duration_seconds || 300;
        if (Date.now() >= started + durationSec * 1000) {
          return { rows: [mockAuction] };
        }
      }
      return { rows: [] };
    }

    // 2. Auction lookup
    if (text.includes('chit_auctions WHERE id = $1')) {
      if (mockAuction && mockAuction.id === params[0]) {
        return { rows: [mockAuction] };
      }
      return { rows: [] };
    }

    // 3. Group lookup
    if (text.includes('chit_groups WHERE id = $1')) {
      if (mockGroup && mockGroup.id === params[0]) {
        return { rows: [mockGroup] };
      }
      return { rows: [] };
    }

    // 4. Bids lookup
    if (text.includes('auction_bids b')) {
      return { rows: [] };
    }

    // 5. Eligible subscribers lookup
    if (text.includes("subscriber_status = 'NPS'")) {
      const match = mockSubscriptions.filter((s) => s.chit_group_id === params[0] && s.subscriber_status === 'NPS');
      return { rows: match };
    }

    // 6. Subscriptions in group for notification or lookup
    if (text.includes('FROM subscriptions')) {
      return { rows: mockSubscriptions.filter((s) => s.chit_group_id === params[0]) };
    }

    // 7. Insert notification
    if (text.includes('INSERT INTO notifications')) {
      return { rows: [{ id: 'notif-1' }] };
    }

    return { rows: [] };
  }),

  withTransaction: jest.fn(async (callback) => {
    const mockClient = {
      query: jest.fn(async (text, params) => {
        // UPDATE chit_auctions
        if (text.includes('UPDATE chit_auctions')) {
          mockAuction.status = 'COMPLETED';
          mockAuction.winning_bid_pct = params[0];
          mockAuction.winning_subscription_id = params[1];
          mockAuction.closed_at = new Date().toISOString();
          return { rows: [mockAuction] };
        }

        // UPDATE subscriptions
        if (text.includes('UPDATE subscriptions SET subscriber_status = $1') || text.includes("subscriber_status = 'SB'")) {
          const sub = mockSubscriptions.find((s) => s.id === params[1] || s.id === mockSubWinnerId);
          if (sub) {
            sub.subscriber_status = 'SB';
            sub.prized_month = params[0];
          }
          return { rows: [sub] };
        }

        // INSERT sureties
        if (text.includes('INSERT INTO sureties')) {
          const record = { id: 'surety-1', subscription_id: params[0], auction_id: params[1], status: 'PENDING' };
          mockSureties.push(record);
          return { rows: [record] };
        }

        // expireAuctionTickets: UPDATE auction_tickets
        if (text.includes('UPDATE auction_tickets')) {
          for (const t of mockTickets) {
            if (t.subscription_id === mockSubWinnerId) {
              t.status = 'USED';
            } else {
              t.status = 'EXPIRED';
            }
          }
          return { rows: mockTickets };
        }

        // SELECT subscriptions for dividend
        if (text.includes('SELECT id AS subscription_id, ticket_number, subscriber_status FROM subscriptions')) {
          return {
            rows: mockSubscriptions.map((s) => ({
              subscription_id: s.id,
              ticket_number: s.ticket_number,
              subscriber_status: s.subscriber_status,
            })),
          };
        }

        // INSERT ledger_entries
        if (text.includes('INSERT INTO ledger_entries')) {
          const type = text.includes("'COMMISSION'")
            ? 'COMMISSION'
            : text.includes("'PRIZE_PAYOUT'")
            ? 'PRIZE_PAYOUT'
            : text.includes("'DIVIDEND'")
            ? 'DIVIDEND'
            : params[2];
          mockLedgerEntries.push({
            entry_type: type,
            amount: params[1],
            amount_paise: params[2],
          });
          return { rows: [{ id: 'ledger-1' }] };
        }

        // INSERT audit_logs
        if (text.includes('INSERT INTO audit_logs')) {
          mockAuditLogs.push({ event_type: params[0] });
          return { rows: [{ id: 'audit-1' }] };
        }

        return { rows: [] };
      }),
    };

    return await callback(mockClient);
  }),

  logAuditEvent: jest.fn(async () => {}),
  pool: { connect: jest.fn(), end: jest.fn() },
}));

const { finalizeAuctionClose } = await import('../src/services/auctionCloseService.js');
const { checkAndCloseExpiredAuctions } = await import('../src/services/auctionTimerService.js');

describe('Auction End-to-End Workflow & Timer Services', () => {
  beforeEach(() => {
    mockAuction = {
      id: mockAuctionId,
      chit_group_id: mockGroupId,
      month_number: 1,
      status: 'LIVE',
      started_at: new Date(Date.now() - 360 * 1000).toISOString(), // 6 min ago
      duration_seconds: 300, // 5 min duration -> expired!
      created_at: new Date().toISOString(),
    };

    mockGroup = {
      id: mockGroupId,
      name: 'Naveen Royal Chit 1 Lakh',
      chit_amount: 100000,
      foreman_commission_pct: 5,
      dividend_distribution_policy: 'ALL_SUBSCRIBERS',
    };

    mockSubscriptions = [
      {
        id: mockSubWinnerId,
        chit_group_id: mockGroupId,
        ticket_number: 1,
        subscriber_status: 'NPS',
      },
      {
        id: mockSubOtherId,
        chit_group_id: mockGroupId,
        ticket_number: 2,
        subscriber_status: 'NPS',
      },
    ];

    mockLedgerEntries = [];
    mockSureties = [];
    mockAuditLogs = [];
    mockTickets = [
      { id: 'tkt-1', auction_id: mockAuctionId, subscription_id: mockSubWinnerId, status: 'ACTIVE' },
      { id: 'tkt-2', auction_id: mockAuctionId, subscription_id: mockSubOtherId, status: 'ACTIVE' },
    ];
  });

  it('1. finalizeAuctionClose closes live auction and sets winner to SB with 5% statutory floor', async () => {
    const result = await finalizeAuctionClose({
      auctionId: mockAuctionId,
      actorType: 'SUPERADMIN',
      reason: 'Foreman manual stop',
      forceClosed: true,
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.winningBidPct).toBe(5); // 5% foreman minimum commission floor
    expect(result.winnerSubscriptionId).toBe(mockSubWinnerId);
    expect(result.prizeAmount).toBe(95000); // 100000 - 5% = 95,000

    // Winner ticket marked USED, others marked EXPIRED
    const winnerTkt = mockTickets.find((t) => t.subscription_id === mockSubWinnerId);
    const otherTkt = mockTickets.find((t) => t.subscription_id === mockSubOtherId);
    expect(winnerTkt.status).toBe('USED');
    expect(otherTkt.status).toBe('EXPIRED');

    // Winner subscription updated to 'SB'
    const winnerSub = mockSubscriptions.find((s) => s.id === mockSubWinnerId);
    expect(winnerSub.subscriber_status).toBe('SB');

    // Ledger records generated
    expect(mockLedgerEntries.some((e) => e.entry_type === 'COMMISSION')).toBe(true);
    expect(mockLedgerEntries.some((e) => e.entry_type === 'PRIZE_PAYOUT')).toBe(true);
  });

  it('2. checkAndCloseExpiredAuctions automatically closes auctions past their fixed duration', async () => {
    mockAuction.status = 'LIVE';
    mockAuction.started_at = new Date(Date.now() - 310 * 1000).toISOString(); // 310s ago, duration 300s
    mockAuction.duration_seconds = 300;

    await checkAndCloseExpiredAuctions(null);

    expect(mockAuction.status).toBe('COMPLETED');
    expect(mockAuction.winning_bid_pct).toBe(5);
  });

  it('3. Does not close live auctions whose fixed duration has not yet expired', async () => {
    mockAuction.status = 'LIVE';
    mockAuction.started_at = new Date(Date.now() - 60 * 1000).toISOString(); // Only 60s ago, duration 300s
    mockAuction.duration_seconds = 300;

    await checkAndCloseExpiredAuctions(null);

    // Should stay LIVE
    expect(mockAuction.status).toBe('LIVE');
  });
});
