"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../middleware/auth"));
const roleApplication_1 = require("../models/roleApplication");
const router = express_1.default.Router();
router.use(auth_1.default);
router.post('/apply-technician', async (req, res) => {
    try {
        if (req.user?.role !== 'user')
            return res.status(403).json({ error: 'Only regular users can apply for professional roles' });
        await (0, roleApplication_1.createApplication)({
            userId: req.user.id,
            requestedRole: 'technician',
            status: 'pending',
            documents: req.body.documents || [],
            notes: req.body.notes || ''
        });
        res.json({ success: true, message: 'Technician application submitted for review' });
    }
    catch (err) {
        console.error('Technician application error:', err);
        res.status(500).json({ error: 'Application failed' });
    }
});
router.post('/apply-delivery', async (req, res) => {
    try {
        if (req.user?.role !== 'user')
            return res.status(403).json({ error: 'Only regular users can apply for professional roles' });
        await (0, roleApplication_1.createApplication)({
            userId: req.user.id,
            requestedRole: 'delivery',
            status: 'pending',
            documents: req.body.documents || [],
            notes: req.body.notes || ''
        });
        res.json({ success: true, message: 'Delivery personnel application submitted for review' });
    }
    catch (err) {
        console.error('Delivery application error:', err);
        res.status(500).json({ error: 'Application failed' });
    }
});
exports.default = router;
//# sourceMappingURL=recruitment.js.map