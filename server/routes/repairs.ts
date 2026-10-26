import express from 'express';
import { supabase } from '../db.js';
import { getRepairById } from '../models/repair.js';
import { scheduleRepair, getMyRepairs, acceptRepair, updateRepairStatus } from '../controllers/repair.js';
import authMiddleware from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = express.Router();

// GET /repairs/assigned: Fetch repairs assigned to delivery person (strictly scoped to allocated shop)
router.get('/assigned', authMiddleware, roleCheck(['delivery', 'admin', 'shop']), async (req, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole === 'delivery') {
      const { data: dp } = await supabase
        .from('DeliveryPersonnel')
        .select('id, shopId')
        .or(`userId.eq.${req.user?.id},email.eq.${req.user?.email || 'none'}`)
        .maybeSingle();

      if (!dp) {
        return res.json([]);
      }

      let query = supabase.from('RepairRequest').select('*');

      if (dp.shopId) {
        query = query.or(`deliveryPersonnelId.eq.${dp.id},and(shopId.eq.${dp.shopId},delivery.eq.true)`);
      } else {
        query = query.eq('deliveryPersonnelId', dp.id);
      }

      const { data, error } = await query.order('createdAt', { ascending: false });
      if (error) throw error;
      return res.json(data);
    } else if (userRole === 'shop') {
      const { data: myShop } = await supabase
        .from('Shops')
        .select('id')
        .or(`userId.eq.${req.user?.id},name.ilike.%${req.user?.name || 'nomatch'}%`)
        .maybeSingle();

      let query = supabase.from('RepairRequest').select('*');
      if (myShop) {
        query = query.eq('shopId', myShop.id);
      }
      const { data, error } = await query.order('createdAt', { ascending: false });
      if (error) throw error;
      return res.json(data);
    } else {
      // Admin
      const { data, error } = await supabase
        .from('RepairRequest')
        .select('*')
        .not('deliveryPersonnelId', 'is', null)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return res.json(data);
    }
  } catch (err) {
    console.error('Assigned repairs fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /repairs/:id/request-delivery: Request delivery personnel to deliver device
router.post('/:id/request-delivery', authMiddleware, roleCheck(['user', 'admin', 'shop', 'technician']), async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryPersonnelId } = req.body;

    const updates: any = {
      delivery: true,
      updatedAt: new Date()
    };
    if (deliveryPersonnelId) {
      updates.deliveryPersonnelId = deliveryPersonnelId;
      updates.status = 'dispatched';
    } else {
      updates.status = 'awaiting_pickup';
    }

    const { updateRepair } = await import('../models/repair.js');
    const repair = await updateRepair(id, updates);

    const { io } = await import('../app.js');
    io.emit('delivery_request', { 
      repairId: id, 
      deliveryPersonnelId: deliveryPersonnelId || null, 
      status: updates.status, 
      requestedBy: req.user?.role 
    });
    io.emit('repair_update', { repairId: id, ...updates });

    res.json({ success: true, message: 'Delivery requested successfully', repair });
  } catch (err) {
    console.error('Request delivery error:', err);
    res.status(500).json({ error: (err as Error).message || 'Failed to request delivery' });
  }
});

// GET /repairs/tech-assigned: Fetch repairs assigned to technician
router.get('/tech-assigned', authMiddleware, roleCheck(['technician', 'admin', 'shop']), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('RepairRequest')
      .select('*')
      .not('technicianId', 'is', null);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /repairs: Fetch user's repairs (alias for /my)
router.get('/', authMiddleware, getMyRepairs);

// POST /repairs: Schedule repair
router.post('/', authMiddleware, scheduleRepair);

// GET /repairs/my: Fetch user's repairs
router.get('/my', authMiddleware, getMyRepairs);

// GET /repairs/:id: For tracking
router.get('/:id', async (req, res) => {
  try {
    const repair = await getRepairById(req.params.id);
    if (!repair) return res.status(404).json({ error: 'Repair not found' });
    res.json(repair);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /repairs/accept/:id: Accept repair and set price
router.post('/accept/:id', authMiddleware, acceptRepair);

// PATCH /repairs/:id: Update repair status/technician assignment
router.patch('/:id', authMiddleware, updateRepairStatus);

export default router;