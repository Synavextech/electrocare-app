import { createTrackingLog, getTrackingByRepair } from '../models/tracking';
import { io } from '../app';
export const getTracking = async (req, res) => {
    try {
        const { repairId } = req.params;
        const logs = await getTrackingByRepair(repairId);
        res.json(logs);
    }
    catch (err) {
        console.error('Fetch failed:', err.message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
export const updateTracking = async (req, res) => {
    try {
        const { repairId, status } = req.body;
        const log = await createTrackingLog({ repairId, status });
        io.emit('tracking_update', log); // Real-time
        res.json(log);
    }
    catch (err) {
        console.error('Update failed:', err.message);
        res.status(500).json({ error: 'Update failed' });
    }
};
//# sourceMappingURL=tracking.js.map