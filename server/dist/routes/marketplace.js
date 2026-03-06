import express from 'express';
import { listListings, postListing, purchaseListing } from '../controllers/marketplace';
import authMiddleware from '../middleware/auth';
const router = express.Router();
router.get('/', listListings);
router.post('/', authMiddleware, postListing);
router.post('/purchase', authMiddleware, purchaseListing);
export default router;
//# sourceMappingURL=marketplace.js.map