import express from 'express';
import authMiddleware from '../middleware/auth';
import { createTechnician } from '../models/technician';
import { updateUser } from '../models/user';
const router = express.Router();
router.use(authMiddleware);
router.post('/apply-technician', async (req, res) => {
    try {
        if (req.user?.role !== 'user')
            return res.status(403).json({ error: 'Forbidden' });
        await createTechnician({ userId: req.user.id });
        await updateUser(req.user.id, { role: 'technician' }); // Pending admin approval in prod
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Application failed' });
    }
});
export default router;
//# sourceMappingURL=recruitment.js.map