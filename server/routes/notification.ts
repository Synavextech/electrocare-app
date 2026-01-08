import express from 'express';
import authMiddleware from '../middleware/auth';
import { sendNotification } from '../controllers/notification';

const router = express.Router();
router.use(authMiddleware);

router.post('/', sendNotification);

export default router;