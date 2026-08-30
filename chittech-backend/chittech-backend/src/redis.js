const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  console.error('Redis error', err.message);
});

// --- Key helpers for live auction state ---
const auctionKey = (auctionId) => `auction:${auctionId}:state`;
const auctionBidsKey = (auctionId) => `auction:${auctionId}:bids`; // recent bid log (list)

module.exports = { redis, auctionKey, auctionBidsKey };
