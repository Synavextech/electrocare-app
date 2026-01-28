"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const admin_1 = require("../controllers/admin");
const router = express_1.default.Router();
router.use(auth_1.default);
router.post('/approve-sale', admin_1.approveSale);
router.post('/reject-sale', admin_1.rejectSale);
router.post('/approve-withdrawal', admin_1.approveWithdrawal);
router.get('/analytics', admin_1.getAnalytics);
router.get('/users', admin_1.getUsers);
router.get('/pending-sales', admin_1.getPendingSales);
router.get('/repairs', admin_1.getAllRepairs);
router.get('/withdrawal-requests', admin_1.getWithdrawalRequests);
router.get('/purchase-requests', admin_1.getPurchaseRequests);
router.post('/approve-purchase', admin_1.approvePurchase);
router.get('/role-applications', admin_1.getRoleApplications);
router.post('/approve-role-application', admin_1.approveRoleApplication);
router.post('/reject-role-application', admin_1.rejectRoleApplication);
exports.default = router;
//# sourceMappingURL=admin.js.map