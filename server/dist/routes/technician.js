import express from 'express';
import authMiddleware from '../middleware/auth';
import { listTechnicians, getMyAssignments, acceptRepair } from '../controllers/technician';
const router = express.Router();
router.use(authMiddleware);
router.get('/', listTechnicians);
router.get('/assignments', getMyAssignments);
router.post('/accept/:id', acceptRepair);
export default router;
//# sourceMappingURL=technician.js.map