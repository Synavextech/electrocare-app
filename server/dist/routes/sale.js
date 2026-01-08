import express from 'express';
import authMiddleware from '../middleware/auth';
import { createDeviceSale, getMySales } from '../controllers/sale';
const router = express.Router();
router.use(authMiddleware);
router.post('/', createDeviceSale);
router.get('/', getMySales);
export default router;
//# sourceMappingURL=sale.js.map