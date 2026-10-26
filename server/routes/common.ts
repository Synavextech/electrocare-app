import express from 'express';
import { getDeviceTypes, getDeviceModels, updateDeviceModelsBulk } from '../models/deviceInfo.js';
import authMiddleware from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = express.Router();

router.get('/device-types', async (req, res) => {
    try {
        const types = await getDeviceTypes();
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load device types' });
    }
});

router.get('/models', async (req, res) => {
    try {
        const { deviceTypeId } = req.query;
        const models = await getDeviceModels(deviceTypeId as string);
        res.json(models);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load models' });
    }
});

router.post('/admin/models', authMiddleware, roleCheck(['admin']), async (req, res) => {
    try {
        await updateDeviceModelsBulk(req.body);
        res.json({ message: 'Models updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update models' });
    }
});

import { getDeliveryPersonnel, updateDeliveryPersonnel, updateDeliveryPersonnelStatus } from '../models/delivery.js';

router.get('/delivery-personnel', async (req, res) => {
    try {
        const { shopId, lat, lng, radius } = req.query;
        const personnel = await getDeliveryPersonnel({
            shopId: shopId ? String(shopId) : undefined,
            lat: lat !== undefined ? parseFloat(String(lat)) : undefined,
            lng: lng !== undefined ? parseFloat(String(lng)) : undefined,
            radiusKm: radius !== undefined ? parseFloat(String(radius)) : undefined,
        });
        res.json(personnel);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load delivery personnel' });
    }
});

router.patch('/delivery-personnel/:id/status', authMiddleware, roleCheck(['admin', 'shop']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, statusNote } = req.body;
        if (!status || typeof status !== 'string') {
            return res.status(400).json({ error: 'Status is required and must be a string' });
        }
        const updated = await updateDeliveryPersonnelStatus(id, status.trim(), statusNote);
        res.json(updated);
    } catch (error: any) {
        console.error('Update delivery status error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to update delivery status' });
    }
});

router.patch('/delivery-personnel/:id', authMiddleware, roleCheck(['admin', 'shop']), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updated = await updateDeliveryPersonnel(id, updates);
        res.json(updated);
    } catch (error: any) {
        console.error('Update delivery details error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to update delivery details' });
    }
});

export default router;
