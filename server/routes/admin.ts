import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
    approveSale,
    approveWithdrawal,
    getAnalytics,
    getUsers,
    getPendingSales,
    getAllRepairs,
    getWithdrawalRequests,
    rejectSale,
    getPurchaseRequests,
    approvePurchase,
    getRoleApplications,
    approveRoleApplication,
    rejectRoleApplication,
    updateUserRole,
    getTechnicianReports,
    updateTechnicianReport
} from '../controllers/admin.js';

import { roleCheck } from '../middleware/roleCheck.js';

const router = express.Router();
router.use(authMiddleware);

// Sales review endpoints: accessible by admin, shop, and technician
router.get('/pending-sales', roleCheck(['admin', 'shop', 'technician']), getPendingSales);
router.post('/approve-sale', roleCheck(['admin', 'shop', 'technician']), approveSale);
router.post('/reject-sale', roleCheck(['admin', 'shop', 'technician']), rejectSale);

// Strict admin-only management endpoints
router.post('/approve-withdrawal', roleCheck(['admin']), approveWithdrawal);
router.get('/analytics', roleCheck(['admin']), getAnalytics);
router.get('/users', roleCheck(['admin']), getUsers);
router.patch('/users/:id/role', roleCheck(['admin']), updateUserRole);
router.get('/repairs', roleCheck(['admin']), getAllRepairs);
router.get('/withdrawal-requests', roleCheck(['admin']), getWithdrawalRequests);
router.get('/purchase-requests', roleCheck(['admin']), getPurchaseRequests);
router.post('/approve-purchase', roleCheck(['admin']), approvePurchase);
router.get('/role-applications', roleCheck(['admin']), getRoleApplications);
router.post('/approve-role-application', roleCheck(['admin']), approveRoleApplication);
router.post('/reject-role-application', roleCheck(['admin']), rejectRoleApplication);
router.get('/technician-reports', roleCheck(['admin']), getTechnicianReports);
router.patch('/technician-reports/:id', roleCheck(['admin']), updateTechnicianReport);

export default router;
