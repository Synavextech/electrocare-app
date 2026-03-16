import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { sendNotification, broadcastNotification } from '../controllers/notification.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/', sendNotification);
router.post('/broadcast', broadcastNotification);

export default router;
