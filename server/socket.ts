import { Server, Socket } from 'socket.io';
import { supabase } from './db';

export function initSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('User connected');

    socket.on('joinRepair', async (repairId: string) => {
      socket.join(repairId);
      // TODO: Implement Supabase-based tracking
      socket.emit('trackingUpdate', { message: 'Connected' });
    });

    socket.on('updateStatus', async ({ repairId, status }: { repairId: string; status: string }) => {
      // TODO: Implement Supabase-based status updates
      io.to(repairId).emit('trackingUpdate', { status });
    });

    socket.on('disconnect', () => console.log('User disconnected'));
  });
}