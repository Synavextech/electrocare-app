import express from 'express';
import { getTracking, updateTracking, getUpdates } from '../controllers/tracking.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/updates', authMiddleware, getUpdates);
router.get('/:repairId', authMiddleware, getTracking);
router.post('/', authMiddleware, updateTracking);

export default router;
