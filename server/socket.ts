import { Server, Socket } from 'socket.io';
import { supabase } from './db.js';

export let io: Server | null = null;

export function initSocket(serverIo: Server) {
  io = serverIo;
  serverIo.on('connection', (socket: Socket) => {
    console.log('User connected');

    socket.on('joinRepair', async (repairId: string) => {
      socket.join(repairId);
      // TODO: Implement Supabase-based tracking
      socket.emit('trackingUpdate', { message: 'Connected' });
    });

    socket.on('updateStatus', async ({ repairId, status }: { repairId: string; status: string }) => {
      // TODO: Implement Supabase-based status updates
      serverIo.to(repairId).emit('trackingUpdate', { status });
    });

    socket.on('disconnect', () => console.log('User disconnected'));
  });
}