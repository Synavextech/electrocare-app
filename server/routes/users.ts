import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { getUserStats } from '../controllers/user.js';
import { getDeliveryPersonnel } from '../models/delivery.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/me/stats', getUserStats);

router.get('/delivery', async (req, res) => {
    try {
        const personnel = await getDeliveryPersonnel();
        res.json(personnel);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Failed to fetch delivery personnel' });
    }
});

export default router;
