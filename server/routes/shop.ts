import express from 'express';
import { listShops, getNearby, registerShop, updateServices, updateStatus, configureShop, getMyShop } from '../controllers/shop.js';
import authMiddleware from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = express.Router();

router.get('/', listShops);
router.get('/nearby', getNearby);
router.get('/me', authMiddleware, roleCheck(['admin', 'shop']), getMyShop);
router.post('/', authMiddleware, roleCheck(['admin', 'shop']), registerShop);
router.patch('/:id/status', authMiddleware, roleCheck(['admin', 'shop']), updateStatus);
router.patch('/:id', authMiddleware, roleCheck(['admin', 'shop']), configureShop);
router.post('/:shopCode/services', authMiddleware, roleCheck(['admin', 'shop']), updateServices);

export default router;