const Redis = require('ioredis');

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

module.exports = { redis, auctionKey, auctionBidsKey };
