import express from 'express';
import { supabase } from '../db';
import { z } from 'zod';
import { createRepair, getRepairById } from '../models/repair';
import { acceptRepair } from '../controllers/repair';
import authMiddleware from '../middleware/auth';
const router = express.Router();
// Zod schema for repair
const repairSchema = z.object({
    deviceType: z.string().optional(),
    device_type: z.string().optional(),
    issue: z.string().min(1),
    delivery: z.boolean(),
    shopId: z.string().optional(),
    technicianId: z.string().optional(),
    deliveryPersonnelId: z.string().optional(),
    paymentMethod: z.enum(['online', 'cod']).optional(),
}).refine(data => data.deviceType || data.device_type, {
    message: "Device type is required",
    path: ["deviceType"]
});
// GET /repairs/assigned: Fetch repairs assigned to delivery person
router.get('/assigned', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'delivery' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        // In a real app, we'd filter by the specific delivery person's ID linked to this user
        // For now, return all repairs that have a deliveryPersonnelId set
        const { data, error } = await supabase
            .from('RepairRequest')
            .select('*')
            .not('deliveryPersonnelId', 'is', null);
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
// GET /repairs/tech-assigned: Fetch repairs assigned to technician
router.get('/tech-assigned', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'technician' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const { data, error } = await supabase
            .from('RepairRequest')
            .select('*')
            .not('technicianId', 'is', null); // Filter logic can be improved
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
// GET /repairs: Fetch user's repairs
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('RepairRequest')
            .select('*')
            .eq('userId', req.user.id);
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
// POST /repairs: Schedule repair
router.post('/', authMiddleware, async (req, res) => {
    try {
        const data = repairSchema.parse(req.body);
        const repair = await createRepair({
            userId: req.user.id,
            deviceType: data.deviceType || data.device_type,
            issue: data.issue,
            delivery: data.delivery,
            shopId: data.shopId,
            technicianId: data.technicianId,
            deliveryPersonnelId: data.deliveryPersonnelId,
            paymentMethod: data.paymentMethod,
        });
        res.status(201).json({ id: repair.id, message: 'Repair scheduled' });
    }
    catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Invalid repair data' });
    }
});
// GET /repairs/my: Fetch user's repairs
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('RepairRequest')
            .select('*')
            .eq('userId', req.user.id);
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
// GET /repairs/:id: For tracking
router.get('/:id', async (req, res) => {
    try {
        const repair = await getRepairById(req.params.id);
        if (!repair)
            return res.status(404).json({ error: 'Repair not found' });
        res.json(repair);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
// POST /repairs/accept/:id: Accept repair and set price
router.post('/accept/:id', authMiddleware, acceptRepair);
export default router;
//# sourceMappingURL=repairs.js.map