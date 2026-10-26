import express from 'express';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import authMiddleware from '../middleware/auth.js';
import { roleCheck } from '../middleware/roleCheck.js';
import {
  submitInquiry,
  listInquiries,
  getInquiryDetails,
  updateInquiry,
} from '../controllers/serviceInquiry.js';

const router = express.Router();

// Public submission with optional user attachment
router.post('/', optionalAuthMiddleware, submitInquiry);

// User or admin viewing inquiries
router.get('/', authMiddleware, listInquiries);
router.get('/:id', authMiddleware, getInquiryDetails);

// Admin update status & notes
router.patch('/:id', authMiddleware, roleCheck(['admin']), updateInquiry);

export default router;
