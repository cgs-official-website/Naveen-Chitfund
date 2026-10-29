import Redis from 'ioredis';

let redis;
const redisUrl = process.env.REDIS_URL;

if (redisUrl && !redisUrl.includes('localhost')) {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      return Math.min(times * 100, 3000);
    },
  });
  redis.on('error', (err) => {
    console.error('Redis error:', err.message);
  });
} else {
  // In-memory fallback if Redis is not configured or in local mode without Redis
  console.log('Using in-memory store for live auction cache (no external Redis)');
  const memStore = new Map();
  const listStore = new Map();
  redis = {
    get: async (key) => memStore.get(key) || null,
    set: async (key, val) => memStore.set(key, val),
    del: async (key) => memStore.delete(key),
    lpush: async (key, val) => {
      if (!listStore.has(key)) listStore.set(key, []);
      listStore.get(key).unshift(val);
    },
    ltrim: async (key, start, stop) => {
      if (listStore.has(key)) {
        listStore.set(key, listStore.get(key).slice(start, stop + 1));
      }
    },
    on: () => {},
  };
}

// --- Key helpers for live auction state ---
const auctionKey = (auctionId) => `auction:${auctionId}:state`;
const auctionBidsKey = (auctionId) => `auction:${auctionId}:bids`; // recent bid log (list)

const DEFAULT_AUCTION_DURATION_SECONDS = 300; // 5 minutes standard auction window

function createLiveAuctionState({ minBidPct, durationSeconds = DEFAULT_AUCTION_DURATION_SECONDS, startedAt = Date.now() }) {
  const now = Date.now();
  const startMs = typeof startedAt === 'string' ? new Date(startedAt).getTime() : (startedAt || now);
  return {
    lowestBidPct: null,
    highestBidPct: null,
    minBidPct: minBidPct || 5,
    bidderSubscriptionId: null,
    startedAt: startMs,
    durationSeconds: Number(durationSeconds) || DEFAULT_AUCTION_DURATION_SECONDS,
    updatedAt: now,
  };
}

function calculateAuctionTiming(liveState, dbAuction) {
  const now = Date.now();
  const durationSeconds = Number(liveState?.durationSeconds || dbAuction?.duration_seconds || DEFAULT_AUCTION_DURATION_SECONDS);

  let startedAtMs = null;
  if (liveState?.startedAt) {
    startedAtMs = Number(liveState.startedAt);
  } else if (dbAuction?.started_at) {
    startedAtMs = new Date(dbAuction.started_at).getTime();
  } else if (dbAuction?.scheduled_at && dbAuction.status === 'LIVE') {
    startedAtMs = new Date(dbAuction.scheduled_at).getTime();
  } else if (dbAuction?.created_at && dbAuction.status === 'LIVE') {
    startedAtMs = new Date(dbAuction.created_at).getTime();
  }

  let remainingSeconds = 0;
  let elapsedSeconds = 0;

  if (startedAtMs && dbAuction?.status === 'LIVE') {
    elapsedSeconds = Math.max(0, Math.floor((now - startedAtMs) / 1000));
    // If the auction was started earlier than duration but is still LIVE in DB,
    // ensure subscribers have an active timer window to bid rather than displaying 0s
    if (elapsedSeconds < durationSeconds) {
      remainingSeconds = durationSeconds - elapsedSeconds;
    } else {
      // Overtime / final call: Keep active 60s window or 0 if truly terminating
      remainingSeconds = Math.max(0, 60 - ((now - (liveState?.updatedAt || now)) / 1000));
    }
  } else if (dbAuction?.status === 'LIVE') {
    remainingSeconds = durationSeconds;
  }

  let startsInSeconds = null;
  if (dbAuction?.status === 'SCHEDULED' && dbAuction?.scheduled_at) {
    const schedMs = new Date(dbAuction.scheduled_at).getTime();
    startsInSeconds = Math.max(0, Math.floor((schedMs - now) / 1000));
  }

  return {
    startedAt: startedAtMs ? new Date(startedAtMs).toISOString() : null,
    durationSeconds,
    elapsedSeconds,
    remainingSeconds: Math.round(remainingSeconds),
    startsInSeconds,
  };
}

export {
  redis,
  auctionKey,
  auctionBidsKey,
  DEFAULT_AUCTION_DURATION_SECONDS,
  createLiveAuctionState,
  calculateAuctionTiming,
};

