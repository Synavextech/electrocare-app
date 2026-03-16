import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { createDeviceSale, getMySales } from '../controllers/sale.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/', createDeviceSale);
router.get('/', getMySales);

export default router;
