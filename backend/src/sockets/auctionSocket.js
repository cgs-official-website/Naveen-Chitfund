import jwt from 'jsonwebtoken';

/**
 * Sets up Socket.IO auction rooms.
 * Supports both event naming conventions:
 *   Incoming: 'join_auction' / 'joinAuction' / 'auction:join'
 *             'leave_auction' / 'leaveAuction' / 'auction:leave'
 *   Outgoing: 'bid_placed' AND 'auction:bid'
 *             'auction_closed' AND 'auction:closed'
 */
function attachAuctionSocket(io) {
  io.on('connection', (socket) => {
    const handleJoin = ({ auctionId, token }) => {
      try {
        if (token) jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        // read-only viewing allowed
      }
      if (!auctionId) return;
      socket.join(roomName(auctionId));
      socket.emit('joined_auction', { auctionId });
      socket.emit('auction:joined', { auctionId });
    };

    const handleLeave = ({ auctionId }) => {
      if (auctionId) socket.leave(roomName(auctionId));
    };

    socket.on('join_auction', handleJoin);
    socket.on('joinAuction', handleJoin);
    socket.on('auction:join', handleJoin);

    socket.on('leave_auction', handleLeave);
    socket.on('leaveAuction', handleLeave);
    socket.on('auction:leave', handleLeave);
  });
}

function roomName(auctionId) {
  return `auction:${auctionId}`;
}

function broadcastBid(io, auctionId, payload) {
  const room = roomName(auctionId);
  const data = { auctionId, ...payload };
  io.to(room).emit('bid_placed', data);
  io.to(room).emit('auction:bid', data);
}

function broadcastClose(io, auctionId, payload) {
  const room = roomName(auctionId);
  const data = { auctionId, ...payload };
  io.to(room).emit('auction_closed', data);
  io.to(room).emit('auction:closed', data);
}

export { attachAuctionSocket, broadcastBid, broadcastClose, roomName };

