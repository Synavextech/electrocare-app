import express from 'express';
import { listShops, getNearby, registerShop } from '../controllers/shop.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', listShops);
router.get('/nearby', getNearby);
router.post('/', authMiddleware, registerShop); // Protected route

export default router;