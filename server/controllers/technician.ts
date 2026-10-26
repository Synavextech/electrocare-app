import { Request, Response } from 'express';
import { 
  getTechniciansByShop, 
  updateTechnician, 
  updateTechnicianStatus,
  deleteTechnicianRecord,
  transferTechnicianShop,
  createTechnicianReport 
} from '../models/technician.js';
import { updateRepair } from '../models/repair.js';
import { supabase } from '../db.js';

export const listTechnicians = async (req: Request, res: Response) => {
  try {
    const { shopId } = req.query;
    const technicians = await getTechniciansByShop(shopId as string);
    res.json(technicians);
  } catch (err) {
    console.error('Fetch failed:', (err as Error).message);
    res.status(500).json({ error: 'Fetch failed' });
  }
};

export const updateTechnicianDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await updateTechnician(id, updates);
    res.json(updated);
  } catch (err) {
    console.error('Update technician details failed:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message || 'Failed to update technician details' });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, statusNote } = req.body;
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ error: 'Status is required and must be a string' });
    }
    const updated = await updateTechnicianStatus(id, status.trim(), statusNote);
    res.json(updated);
  } catch (err) {
    console.error('Update technician status failed:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message || 'Failed to update technician status' });
  }
};

export const getMyAssignments = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'technician') return res.status(403).json({ error: 'Forbidden' });

    // Resolve Technicians record ID from auth userId
    const { data: tech } = await supabase
      .from('Technicians')
      .select('id')
      .eq('userId', req.user.id)
      .maybeSingle();

    if (!tech) {
      return res.json([]);
    }

    const { data: repairs, error } = await supabase
      .from('RepairRequest')
      .select('*')
      .eq('technicianId', tech.id);

    if (error) throw error;
    res.json(repairs);
  } catch (err) {
    console.error('Fetch failed:', (err as Error).message);
    res.status(500).json({ error: 'Fetch failed' });
  }
};

// Accept repair
export const acceptRepair = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'technician') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;

    const { data: tech } = await supabase
      .from('Technicians')
      .select('id')
      .eq('userId', req.user.id)
      .maybeSingle();

    if (!tech) {
      return res.status(404).json({ error: 'Technician record not found' });
    }

    const repair = await updateRepair(id, { technicianId: tech.id, status: 'in_progress' });
    res.json(repair);
  } catch (err) {
    console.error('Accept failed:', (err as Error).message);
    res.status(500).json({ error: 'Accept failed' });
  }
};

export const deleteTechnician = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can delete technician accounts' });
    }
    const { id } = req.params;
    const result = await deleteTechnicianRecord(id);
    res.json(result);
  } catch (err) {
    console.error('Delete technician failed:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message || 'Failed to delete technician' });
  }
};

export const transferTechnician = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can transfer technicians between shops' });
    }
    const { id } = req.params;
    const { shopId } = req.body;
    if (!shopId) {
      return res.status(400).json({ error: 'Destination shopId is required' });
    }
    const updated = await transferTechnicianShop(id, shopId);
    res.json(updated);
  } catch (err) {
    console.error('Transfer technician failed:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message || 'Failed to transfer technician' });
  }
};

export const reportTechnician = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, details, shopId, technicianName } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Report reason is required' });
    }
    const report = await createTechnicianReport({
      technicianId: id,
      technicianName,
      shopId,
      reporterUserId: req.user!.id,
      reason: reason.trim(),
      details: details ? details.trim() : undefined
    });
    res.json({ success: true, message: 'Technician reported to Administrator successfully', report });
  } catch (err) {
    console.error('Report technician failed:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message || 'Failed to file technician report' });
  }
};