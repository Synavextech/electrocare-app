"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTracking = exports.getTracking = void 0;
const tracking_1 = require("../models/tracking");
const app_1 = require("../app");
const getTracking = async (req, res) => {
    try {
        const { repairId } = req.params;
        const logs = await (0, tracking_1.getTrackingByRepair)(repairId);
        res.json(logs);
    }
    catch (err) {
        console.error('Fetch failed:', err.message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.getTracking = getTracking;
const updateTracking = async (req, res) => {
    try {
        const { repairId, status } = req.body;
        const log = await (0, tracking_1.createTrackingLog)({ repairId, status });
        app_1.io.emit('tracking_update', log); // Real-time
        res.json(log);
    }
    catch (err) {
        console.error('Update failed:', err.message);
        res.status(500).json({ error: 'Update failed' });
    }
};
exports.updateTracking = updateTracking;
//# sourceMappingURL=tracking.js.map