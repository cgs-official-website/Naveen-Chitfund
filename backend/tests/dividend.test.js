const { calculateDividend, toRupees } = require('../src/services/dividend');

function makeSubs(n, prizedTicket = null) {
  return Array.from({ length: n }, (_, i) => ({
    subscriptionId: `sub-${i + 1}`,
    ticketNumber: i + 1,
    subscriberStatus: prizedTicket === i + 1 ? 'PS' : 'NPS',
  }));
}

describe('calculateDividend', () => {
  test('NON_PRIZED_ONLY: distributes evenly and excludes the winner', () => {
    const subs = makeSubs(5, 1); // ticket 1 is this month's winner, already marked PS
    const result = calculateDividend({
      chitAmount: 500000,
      winningBidPct: 10, // 50,000 discount
      foremanCommissionPct: 5, // 25,000 commission
      policy: 'NON_PRIZED_ONLY',
      subscriptions: subs,
      winningSubscriptionId: 'sub-1',
    });

    // distributable = 50,000 - 25,000 = 25,000 across 4 non-prized subscribers
    expect(toRupees(result.distributablePaise)).toBe(25000);
    expect(result.perSubscriber).toHaveLength(4);
    expect(result.perSubscriber.every((p) => p.subscriptionId !== 'sub-1')).toBe(true);

    const total = result.perSubscriber.reduce((s, p) => s + p.amountPaise, 0);
    expect(total).toBe(result.distributablePaise); // no money created/lost to rounding
  });

  test('ALL_SUBSCRIBERS: includes everyone including the winner', () => {
    const subs = makeSubs(4, 2);
    const result = calculateDividend({
      chitAmount: 100000,
      winningBidPct: 8,
      foremanCommissionPct: 5,
      policy: 'ALL_SUBSCRIBERS',
      subscriptions: subs,
      winningSubscriptionId: 'sub-2',
    });

    expect(result.perSubscriber).toHaveLength(4);
    expect(result.perSubscriber.some((p) => p.subscriptionId === 'sub-2')).toBe(true);
  });

  test('rounding remainder is fully allocated, never lost (odd division)', () => {
    // Distributable that does NOT divide evenly by subscriber count
    const subs = makeSubs(3, 1); // 2 eligible after removing the winner
    const result = calculateDividend({
      chitAmount: 100001, // deliberately odd amount to force remainder paise
      winningBidPct: 10,
      foremanCommissionPct: 3,
      policy: 'NON_PRIZED_ONLY',
      subscriptions: subs,
      winningSubscriptionId: 'sub-1',
    });

    const total = result.perSubscriber.reduce((s, p) => s + p.amountPaise, 0);
    expect(total).toBe(result.distributablePaise);

    // Each individual share should differ from the base by at most 1 paise
    const amounts = result.perSubscriber.map((p) => p.amountPaise);
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    expect(max - min).toBeLessThanOrEqual(1);
  });

  test('throws if bid percentage is lower than commission percentage (negative payout)', () => {
    const subs = makeSubs(3, 1);
    expect(() =>
      calculateDividend({
        chitAmount: 100000,
        winningBidPct: 2,
        foremanCommissionPct: 5,
        policy: 'NON_PRIZED_ONLY',
        subscriptions: subs,
        winningSubscriptionId: 'sub-1',
      })
    ).toThrow(/negative/i);
  });

  test('returns empty payout list when no eligible subscribers remain', () => {
    const subs = makeSubs(1, 1); // only subscriber already prized
    const result = calculateDividend({
      chitAmount: 50000,
      winningBidPct: 10,
      foremanCommissionPct: 5,
      policy: 'NON_PRIZED_ONLY',
      subscriptions: subs,
      winningSubscriptionId: 'sub-1',
    });
    expect(result.perSubscriber).toHaveLength(0);
    expect(result.totalDistributedPaise).toBe(0);
  });
});
