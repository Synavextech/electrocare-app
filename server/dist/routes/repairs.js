"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const zod_1 = require("zod");
const repair_1 = require("../models/repair");
const repair_2 = require("../controllers/repair");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
// Zod schema for repair
const repairSchema = zod_1.z.object({
    deviceType: zod_1.z.string().optional(),
    device_type: zod_1.z.string().optional(),
    device_model: zod_1.z.string().optional(),
    issue: zod_1.z.string().min(1),
    delivery: zod_1.z.boolean(),
    shopId: zod_1.z.string().optional(),
    technicianId: zod_1.z.string().optional(),
    deliveryPersonnelId: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.enum(['online', 'cod']).optional(),
}).refine(data => data.deviceType || data.device_type, {
    message: "Device type is required",
    path: ["deviceType"]
});
// GET /repairs/assigned: Fetch repairs assigned to delivery person
router.get('/assigned', auth_1.default, async (req, res) => {
    try {
        if (req.user.role !== 'delivery' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        // In a real app, we'd filter by the specific delivery person's ID linked to this user
        // For now, return all repairs that have a deliveryPersonnelId set
        const { data, error } = await db_1.supabase
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
router.get('/tech-assigned', auth_1.default, async (req, res) => {
    try {
        if (req.user.role !== 'technician' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const { data, error } = await db_1.supabase
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
router.get('/', auth_1.default, async (req, res) => {
    try {
        const { data, error } = await db_1.supabase
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
router.post('/', auth_1.default, async (req, res) => {
    try {
        const data = repairSchema.parse(req.body);
        const repair = await (0, repair_1.createRepair)({
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
router.get('/my', auth_1.default, async (req, res) => {
    try {
        const { data, error } = await db_1.supabase
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
        const repair = await (0, repair_1.getRepairById)(req.params.id);
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
router.post('/accept/:id', auth_1.default, repair_2.acceptRepair);
exports.default = router;
//# sourceMappingURL=repairs.js.map