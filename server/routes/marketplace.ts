import express from 'express';
import { 
    listListings, 
    postListing, 
    purchaseListing, 
    deleteListing, 
    markAsSold, 
    notifyArrival, 
    updateStock, 
    getMyPurchases, 
    updatePurchaseShippingStatus 
} from '../controllers/marketplace.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', listListings);
router.get('/my-purchases', authMiddleware, getMyPurchases);
router.patch('/purchases/:id/status', authMiddleware, updatePurchaseShippingStatus);
router.post('/', authMiddleware, postListing);
router.post('/purchase', authMiddleware, purchaseListing);
router.delete('/:id', authMiddleware, deleteListing);
router.patch('/:id/sold', authMiddleware, markAsSold);
router.post('/:id/notify-arrival', authMiddleware, notifyArrival);
router.patch('/:id/stock', authMiddleware, updateStock);

export default router;