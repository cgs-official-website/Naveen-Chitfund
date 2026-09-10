const jwt = require('jsonwebtoken');

/**
 * Sets up Socket.IO auction rooms.
 * Clients connect and emit `join_auction` with { auctionId, token } to join a room.
 * Server emits to room `auction:<id>`:
 *   - 'bid_placed'      { auctionId, bidPct, subscriptionId, ticketNumber, bidAt }
 *   - 'auction_closed'  { auctionId, winningBidPct, winningTicketNumber }
 */
function attachAuctionSocket(io) {
  io.on('connection', (socket) => {
    socket.on('join_auction', ({ auctionId, token }) => {
      try {
        if (token) jwt.verify(token, process.env.JWT_SECRET); // just validates, doesn't block anon viewers
      } catch (err) {
        // ignore invalid token — read-only viewing is allowed; bidding is enforced via REST + auth
      }
      if (!auctionId) return;
      socket.join(roomName(auctionId));
      socket.emit('joined_auction', { auctionId });
    });

    socket.on('leave_auction', ({ auctionId }) => {
      if (auctionId) socket.leave(roomName(auctionId));
    });
  });
}

function roomName(auctionId) {
  return `auction:${auctionId}`;
}

function broadcastBid(io, auctionId, payload) {
  io.to(roomName(auctionId)).emit('bid_placed', { auctionId, ...payload });
}

function broadcastClose(io, auctionId, payload) {
  io.to(roomName(auctionId)).emit('auction_closed', { auctionId, ...payload });
}

module.exports = { attachAuctionSocket, broadcastBid, broadcastClose, roomName };
