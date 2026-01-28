"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptRepair = exports.updateRepairStatus = exports.getMyRepairs = exports.scheduleRepair = void 0;
const repair_1 = require("../models/repair");
const app_1 = require("../app");
const scheduleRepair = async (req, res) => {
    try {
        const data = repair_1.RepairSchema.parse(req.body);
        const repair = await (0, repair_1.createRepair)({ ...data, userId: req.user.id });
        // If delivery is requested, find closest delivery person (mock logic for now)
        if (repair.delivery) {
            app_1.io.emit('delivery_request', { repairId: repair.id, location: 'user-location' });
        }
        app_1.io.emit('repair_update', { repairId: repair.id, status: 'pending' }); // Real-time
        res.json(repair);
    }
    catch (err) {
        console.error('Scheduling failed:', err.message);
        res.status(500).json({ error: err.message });
    }
};
exports.scheduleRepair = scheduleRepair;
const getMyRepairs = async (req, res) => {
    try {
        const repairs = await (0, repair_1.getRepairsByUser)(req.user.id);
        res.json(repairs);
    }
    catch (err) {
        console.error('Fetch failed:', err.message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.getMyRepairs = getMyRepairs;
const updateRepairStatus = async (req, res) => {
    try {
        if (req.user?.role !== 'technician')
            return res.status(403).json({ error: 'Forbidden' });
        const { id } = req.params;
        const { status } = req.body;
        const repair = await (0, repair_1.updateRepair)(id, { status });
        app_1.io.emit('repair_update', { repairId: repair.id, status }); // WebSocket notify user
        res.json(repair);
    }
    catch (err) {
        console.error('Update failed:', err.message);
        res.status(500).json({ error: 'Update failed' });
    }
};
exports.updateRepairStatus = updateRepairStatus;
const acceptRepair = async (req, res) => {
    try {
        const { id } = req.params;
        const { cost, estimatedTime } = req.body;
        const userRole = req.user.role;
        if (!['admin', 'shop', 'technician', 'delivery'].includes(userRole)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const updates = {
            status: 'accepted',
            acceptedAt: new Date(),
        };
        if (cost)
            updates.cost = cost;
        if (estimatedTime)
            updates.estimatedTime = estimatedTime;
        // Special logic for delivery personnel acceptance
        if (userRole === 'delivery') {
            updates.cost = 100; // Standard delivery price
            updates.status = 'in_transit'; // Or custom status for pickup
        }
        const repair = await (0, repair_1.updateRepair)(id, updates);
        app_1.io.emit('repair_update', { repairId: repair.id, status: updates.status, cost: updates.cost });
        res.json(repair);
    }
    catch (err) {
        console.error('Accept repair failed:', err.message);
        res.status(500).json({ error: 'Accept repair failed' });
    }
};
exports.acceptRepair = acceptRepair;
//# sourceMappingURL=repair.js.map