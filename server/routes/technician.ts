import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { 
  listTechnicians, 
  getMyAssignments, 
  acceptRepair, 
  updateStatus, 
  updateTechnicianDetails,
  deleteTechnician,
  transferTechnician,
  reportTechnician 
} from '../controllers/technician.js';
import { roleCheck } from '../middleware/roleCheck.js';

const router = express.Router();

router.get('/', listTechnicians);
router.patch('/:id/status', authMiddleware, roleCheck(['admin', 'shop']), updateStatus);
router.patch('/:id', authMiddleware, roleCheck(['admin', 'shop']), updateTechnicianDetails);
router.delete('/:id', authMiddleware, roleCheck(['admin']), deleteTechnician);
router.patch('/:id/transfer', authMiddleware, roleCheck(['admin']), transferTechnician);
router.post('/:id/report', authMiddleware, roleCheck(['shop', 'admin']), reportTechnician);
router.get('/assignments', authMiddleware, roleCheck(['technician', 'admin', 'shop']), getMyAssignments);
router.post('/accept/:id', authMiddleware, roleCheck(['technician', 'shop']), acceptRepair);

export default router;