import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

const SOCKET_URL = Platform.select({
  android: 'http://10.0.2.2:4000',
  default: 'http://localhost:4000',
});

export type SocketStatus = 'connected' | 'reconnecting' | 'disconnected';

let socket: Socket | null = null;
const listeners: ((status: SocketStatus) => void)[] = [];

export const getAuctionSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      notifyStatus('connected');
    });

    socket.on('reconnect_attempt', () => {
      notifyStatus('reconnecting');
    });

    socket.on('disconnect', () => {
      notifyStatus('disconnected');
    });

    socket.on('connect_error', () => {
      notifyStatus('reconnecting');
    });
  }

  return socket;
};

export const subscribeSocketStatus = (cb: (status: SocketStatus) => void) => {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

const notifyStatus = (status: SocketStatus) => {
  listeners.forEach((cb) => cb(status));
};

export const joinAuctionRoom = (auctionId: string) => {
  const s = getAuctionSocket();
  s.emit('joinAuction', { auctionId });
};

export const leaveAuctionRoom = (auctionId: string) => {
  if (socket) {
    socket.emit('leaveAuction', { auctionId });
  }
};
