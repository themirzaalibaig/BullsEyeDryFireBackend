import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from '@/config';

let io: Server | null = null;

export const initWebsocket = (server: HttpServer): Server => {
  io = new Server(server, { cors: { origin: env.CORS_ORIGIN } });
  io.on('connection', (socket) => {
    socket.on('join', (room) => socket.join(room));
    socket.on('leave', (room) => socket.leave(room));
  });
  return io;
};

export const getIo = (): Server => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

export const emitToAll = (event: string, payload: any) => {
  getIo().emit(event, payload);
};

export const emitToRoom = (room: string, event: string, payload: any) => {
  getIo().to(room).emit(event, payload);
};
