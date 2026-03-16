import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { listTechnicians, getMyAssignments, acceptRepair } from '../controllers/technician.js';

import { roleCheck } from '../middleware/roleCheck.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', listTechnicians);
router.get('/assignments', roleCheck(['technician', 'admin', 'shop']), getMyAssignments);
router.post('/accept/:id', roleCheck(['technician', 'shop']), acceptRepair);

export default router;