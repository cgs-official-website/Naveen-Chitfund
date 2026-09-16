import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { attachAuctionSocket } from './sockets/auctionSocket.js';
import { query, pool } from './db.js';
import { redis } from './redis.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import chitGroupRoutes from './routes/chitGroups.js';
import { router as subscriptionRoutes, joinRouter } from './routes/subscriptions.js';
import auctionRoutes from './routes/auctions.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import suretyRoutes from './routes/sureties.js';
import complianceRoutes from './routes/compliance.js';
import mediaRoutes from './routes/media.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*' },
});
app.set('io', io);
attachAuctionSocket(io);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Razorpay webhook needs the RAW body for HMAC signature verification, so it must be
// mounted BEFORE the global express.json() body parser.
app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// --- Routes ---
app.get('/health', async (req, res) => {
  let dbStatus = 'ok';
  try {
    await query('SELECT 1');
  } catch (err) {
    dbStatus = 'degraded';
  }

  let cacheStatus = 'ok';
  try {
    await redis.set('health:ping', 'pong');
  } catch (err) {
    cacheStatus = 'fallback';
  }

  const isHealthy = dbStatus === 'ok';
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbStatus,
        cache: cacheStatus,
      },
    },
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chit-groups', chitGroupRoutes);
app.use('/api/v1/chit-groups', joinRouter); // adds POST /:groupId/join
app.use('/api/v1/subscriptions', subscriptionRoutes); // /mine, /:id/installments, /:id/dividends
app.use('/api/v1', auctionRoutes); // exposes /chit-groups/:groupId/auctions and /auctions/:id/*
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/sureties', suretyRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/compliance', complianceRoutes);
app.use('/api/v1/media', mediaRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  server.listen(PORT, () => {
    console.log(`ChitTech backend listening on port ${PORT}`);
  });

  const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}. Starting zero-downtime graceful shutdown...`);
    server.close(async () => {
      console.log('HTTP server closed. Draining active connections...');
      try {
        if (io) io.close();
        if (pool && pool.end) await pool.end();
        if (redis && typeof redis.quit === 'function') await redis.quit();
        console.log('PostgreSQL and Redis connections closed cleanly. Process exit 0.');
        process.exit(0);
      } catch (err) {
        console.error('Error during graceful shutdown:', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

export { app, server, io };
