import express from 'express';
import { listListings, postListing, purchaseListing } from '../controllers/marketplace.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', listListings);
router.post('/', authMiddleware, postListing);
router.post('/purchase', authMiddleware, purchaseListing);

export default router;