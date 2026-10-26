import { Request, Response } from 'express';
import { createTrackingLog, getTrackingByRepair } from '../models/tracking.js';
import { io } from '../app.js';
import { supabase } from '../db.js';

export const getTracking = async (req: Request, res: Response) => {
  try {
    const { repairId } = req.params;
    const logs = await getTrackingByRepair(repairId);
    res.json(logs);
  } catch (err) {
    console.error('Fetch failed:', (err as Error).message);
    res.status(500).json({ error: 'Fetch failed' });
  }
};

export const getUpdates = async (req: Request, res: Response) => {
  try {
    let query = supabase
      .from('RepairRequest')
      .select('id, request_id, status, issue, updatedAt, createdAt');

    if (req.user && req.user.role === 'user') {
      query = query.eq('userId', req.user.id);
    }

    const { data: repairs, error } = await query.order('updatedAt', { ascending: false }).limit(20);
    if (error) throw error;

    const updates = (repairs || []).map((r: any) => ({
      id: r.id,
      repair_id: r.id,
      status_update: `Repair #${r.request_id} is currently ${String(r.status).toUpperCase()} (${r.issue || 'Service'})`,
      created_at: r.updatedAt || r.createdAt,
    }));

    res.json(updates);
  } catch (err) {
    console.error('Fetch updates failed:', (err as Error).message);
    res.status(500).json({ error: 'Fetch updates failed' });
  }
};

export const updateTracking = async (req: Request, res: Response) => {
  try {
    const { repairId, status } = req.body;
    const log = await createTrackingLog({ repairId, status });
    io.emit('tracking_update', log); // Real-time
    res.json(log);
  } catch (err) {
    console.error('Update failed:', (err as Error).message);
    res.status(500).json({ error: 'Update failed' });
  }
};