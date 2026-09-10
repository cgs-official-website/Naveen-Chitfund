require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { Server } = require('socket.io');

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { attachAuctionSocket } = require('./sockets/auctionSocket');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const chitGroupRoutes = require('./routes/chitGroups');
const { router: subscriptionRoutes, joinRouter } = require('./routes/subscriptions');
const auctionRoutes = require('./routes/auctions');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

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
app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chit-groups', chitGroupRoutes);
app.use('/api/v1/chit-groups', joinRouter); // adds POST /:groupId/join
app.use('/api/v1/subscriptions', subscriptionRoutes); // /mine, /:id/installments, /:id/dividends
app.use('/api/v1', auctionRoutes); // exposes /chit-groups/:groupId/auctions and /auctions/:id/*
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`ChitTech backend listening on port ${PORT}`);
  });
}

module.exports = { app, server, io };
