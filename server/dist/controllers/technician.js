"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptRepair = exports.getMyAssignments = exports.listTechnicians = void 0;
const technician_1 = require("../models/technician");
const repair_1 = require("../models/repair");
const db_1 = require("../db");
const listTechnicians = async (req, res) => {
    try {
        const { shopId } = req.query;
        const technicians = await (0, technician_1.getTechniciansByShop)(shopId);
        res.json(technicians);
    }
    catch (err) {
        console.error('Fetch failed:', err.message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.listTechnicians = listTechnicians;
const getMyAssignments = async (req, res) => {
    try {
        if (req.user?.role !== 'technician')
            return res.status(403).json({ error: 'Forbidden' });
        const { data: repairs, error } = await db_1.supabase
            .from('RepairRequest')
            .select('*')
            .eq('technicianId', req.user.id);
        if (error)
            throw error;
        res.json(repairs);
    }
    catch (err) {
        console.error('Fetch failed:', err.message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.getMyAssignments = getMyAssignments;
// Accept repair
const acceptRepair = async (req, res) => {
    try {
        if (req.user?.role !== 'technician')
            return res.status(403).json({ error: 'Forbidden' });
        const { id } = req.params;
        const repair = await (0, repair_1.updateRepair)(id, { technicianId: req.user.id, status: 'in_progress' });
        res.json(repair);
    }
    catch (err) {
        console.error('Accept failed:', err.message);
        res.status(500).json({ error: 'Accept failed' });
    }
};
exports.acceptRepair = acceptRepair;
//# sourceMappingURL=technician.js.map