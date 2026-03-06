import express from 'express';
import { getDeviceTypes, getDeviceModels, updateDeviceModelsBulk } from '../models/deviceInfo';
import authMiddleware from '../middleware/auth';
import { roleCheck } from '../middleware/roleCheck';
const router = express.Router();
router.get('/device-types', async (req, res) => {
    try {
        const types = await getDeviceTypes();
        res.json(types);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load device types' });
    }
});
router.get('/models', async (req, res) => {
    try {
        const { deviceTypeId } = req.query;
        const models = await getDeviceModels(deviceTypeId);
        res.json(models);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load models' });
    }
});
router.post('/admin/models', authMiddleware, roleCheck(['admin']), async (req, res) => {
    try {
        await updateDeviceModelsBulk(req.body);
        res.json({ message: 'Models updated successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update models' });
    }
});
import { getDeliveryPersonnelByShop } from '../models/delivery';
router.get('/delivery-personnel', async (req, res) => {
    try {
        const { shopId } = req.query;
        const personnel = await getDeliveryPersonnelByShop(shopId);
        res.json(personnel);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load delivery personnel' });
    }
});
export default router;
//# sourceMappingURL=common.js.map