import { Request, Response } from 'express';
import { createRepair, getRepairById, getRepairsByUser, updateRepair, RepairSchema } from '../models/repair';
import { io } from '../app';

export const scheduleRepair = async (req: Request, res: Response) => {
  try {
    const data = RepairSchema.parse(req.body);
    const repair = await createRepair({ ...data, userId: req.user!.id });

    // If delivery is requested, find closest delivery person (mock logic for now)
    if (repair.delivery) {
      io.emit('delivery_request', { repairId: repair.id, location: 'user-location' });
    }

    io.emit('repair_update', { repairId: repair.id, status: 'pending' }); // Real-time
    res.json(repair);
  } catch (err) {
    console.error('Scheduling failed:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getMyRepairs = async (req: Request, res: Response) => {
  try {
    const repairs = await getRepairsByUser(req.user!.id);
    res.json(repairs);
  } catch (err) {
    console.error('Fetch failed:', (err as Error).message);
    res.status(500).json({ error: 'Fetch failed' });
  }
};

export const updateRepairStatus = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'technician') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    const { status } = req.body;
    const repair = await updateRepair(id, { status });
    io.emit('repair_update', { repairId: repair.id, status }); // WebSocket notify user
    res.json(repair);
  } catch (err) {
    console.error('Update failed:', (err as Error).message);
    res.status(500).json({ error: 'Update failed' });
  }
};

export const acceptRepair = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cost, estimatedTime } = req.body;
    const userRole = req.user!.role;

    if (!['admin', 'shop', 'technician', 'delivery'].includes(userRole)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updates: any = {
      status: 'accepted',
      acceptedAt: new Date(),
    };

    if (cost) updates.cost = cost;
    if (estimatedTime) updates.estimatedTime = estimatedTime;

    // Special logic for delivery personnel acceptance
    if (userRole === 'delivery') {
      updates.cost = 100; // Standard delivery price
      updates.status = 'in_transit'; // Or custom status for pickup
    }

    const repair = await updateRepair(id, updates);
    io.emit('repair_update', { repairId: repair.id, status: updates.status, cost: updates.cost });

    res.json(repair);
  } catch (err) {
    console.error('Accept repair failed:', (err as Error).message);
    res.status(500).json({ error: 'Accept repair failed' });
  }
};