/**
 * Dividend calculation for a closed chit auction.
 *
 * bid_discount   = chit_amount * (winning_bid_pct / 100)
 * commission     = chit_amount * (foreman_commission_pct / 100)
 * distributable  = bid_discount - commission
 * dividend_per_subscriber = distributable / N
 *
 * N depends on chit_groups.dividend_distribution_policy:
 *   - ALL_SUBSCRIBERS   -> N = total number of active subscriptions in the group
 *   - NON_PRIZED_ONLY   -> N = active subscriptions that have NOT yet won an auction
 *                          (i.e. subscriber_status !== 'PS'), AFTER this month's winner
 *                          has been marked PS.
 *
 * Rounding: all money math is done in integer paise to avoid floating point drift,
 * then converted back to rupees (2dp) at the end. Any leftover remainder from
 * division (paise that don't divide evenly across N subscribers) is added to the
 * LAST subscriber in ticket_number order, so the sum of all dividend entries always
 * exactly equals `distributable` — no money is created or lost to rounding.
 */

function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

function toRupees(paise) {
  return Math.round(paise) / 100;
}

/**
 * @param {object} params
 * @param {number} params.chitAmount
 * @param {number} params.winningBidPct
 * @param {number} params.foremanCommissionPct
 * @param {'ALL_SUBSCRIBERS'|'NON_PRIZED_ONLY'} params.policy
 * @param {Array<{subscriptionId: string, ticketNumber: number, subscriberStatus: string}>} params.subscriptions
 *        Full list of ACTIVE subscriptions in the group, with subscriber_status ALREADY
 *        updated to reflect this month's winner as 'PS'.
 * @param {string} params.winningSubscriptionId
 * @returns {{
 *   commissionPaise: number,
 *   distributablePaise: number,
 *   perSubscriber: Array<{subscriptionId: string, amountPaise: number}>,
 *   totalDistributedPaise: number
 * }}
 */
function calculateDividend({
  chitAmount,
  winningBidPct,
  foremanCommissionPct,
  policy,
  subscriptions,
  winningSubscriptionId,
}) {
  const chitAmountPaise = toPaise(chitAmount);
  const bidDiscountPaise = Math.round((chitAmountPaise * Number(winningBidPct)) / 100);
  const commissionPaise = Math.round((chitAmountPaise * Number(foremanCommissionPct)) / 100);
  const distributablePaise = bidDiscountPaise - commissionPaise;

  if (distributablePaise < 0) {
    throw new Error('Distributable amount is negative — bid % must exceed commission %');
  }

  let eligible;
  if (policy === 'ALL_SUBSCRIBERS') {
    eligible = subscriptions;
  } else {
    // NON_PRIZED_ONLY: everyone except the winner of THIS auction and any
    // previously-prized subscriber.
    eligible = subscriptions.filter((s) => s.subscriberStatus !== 'PS');
  }

  if (eligible.length === 0) {
    // No one to distribute to (e.g. last month of the chit) — nothing paid out,
    // full amount effectively stays with commission/foreman per policy design.
    return {
      commissionPaise,
      distributablePaise,
      perSubscriber: [],
      totalDistributedPaise: 0,
    };
  }

  // Sort deterministically by ticket_number so remainder allocation is reproducible.
  const sorted = [...eligible].sort((a, b) => a.ticketNumber - b.ticketNumber);

  const base = Math.floor(distributablePaise / sorted.length);
  const remainder = distributablePaise - base * sorted.length;

  const perSubscriber = sorted.map((s, idx) => ({
    subscriptionId: s.subscriptionId,
    // last subscriber absorbs the rounding remainder
    amountPaise: base + (idx === sorted.length - 1 ? remainder : 0),
  }));

  const totalDistributedPaise = perSubscriber.reduce((sum, p) => sum + p.amountPaise, 0);

  return { commissionPaise, distributablePaise, perSubscriber, totalDistributedPaise };
}

module.exports = { calculateDividend, toPaise, toRupees };
