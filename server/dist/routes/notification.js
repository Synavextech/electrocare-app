import express from 'express';
import authMiddleware from '../middleware/auth';
import { sendNotification, broadcastNotification } from '../controllers/notification';
const router = express.Router();
router.use(authMiddleware);
router.post('/', sendNotification);
router.post('/broadcast', broadcastNotification);
export default router;
//# sourceMappingURL=notification.js.map