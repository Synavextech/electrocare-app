import express from 'express';
import { listShops, getNearby, registerShop } from '../controllers/shop';
import authMiddleware from '../middleware/auth';
const router = express.Router();
router.get('/', listShops);
router.get('/nearby', getNearby);
router.post('/', authMiddleware, registerShop); // Protected route
export default router;
//# sourceMappingURL=shop.js.map