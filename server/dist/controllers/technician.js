import { getTechniciansByShop } from '../models/technician';
import { updateRepair } from '../models/repair';
import { supabase } from '../db';
export const listTechnicians = async (req, res) => {
    try {
        const { shopId } = req.query;
        const technicians = await getTechniciansByShop(shopId);
        res.json(technicians);
    }
    catch (err) {
        console.error('Fetch failed:', err.message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
export const getMyAssignments = async (req, res) => {
    try {
        if (req.user?.role !== 'technician')
            return res.status(403).json({ error: 'Forbidden' });
        const { data: repairs, error } = await supabase
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
// Accept repair
export const acceptRepair = async (req, res) => {
    try {
        if (req.user?.role !== 'technician')
            return res.status(403).json({ error: 'Forbidden' });
        const { id } = req.params;
        const repair = await updateRepair(id, { technicianId: req.user.id, status: 'in_progress' });
        res.json(repair);
    }
    catch (err) {
        console.error('Accept failed:', err.message);
        res.status(500).json({ error: 'Accept failed' });
    }
};
//# sourceMappingURL=technician.js.map