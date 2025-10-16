import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      reconnection: true,
    });
  }
  return socket;
};

export const joinRoom = (roomId: string): Promise<void> => {
  return new Promise((resolve) => {
    const socket = getSocket();
    socket.emit('join-room', roomId);
    socket.once('room-joined', () => resolve());
  });
};
