import express from 'express';
import authMiddleware from '../middleware/auth';
import {
    approveSale,
    approveWithdrawal,
    getAnalytics,
    getUsers,
    getPendingSales,
    getAllRepairs,
    getWithdrawalRequests
} from '../controllers/admin';

const router = express.Router();
router.use(authMiddleware);

router.post('/approve-sale', approveSale);
router.post('/approve-withdrawal', approveWithdrawal);
router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.get('/pending-sales', getPendingSales);
router.get('/repairs', getAllRepairs);
router.get('/withdrawal-requests', getWithdrawalRequests);

export default router;