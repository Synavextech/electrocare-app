import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  listCustomRequests,
  postCustomRequest,
  getCustomRequestDetails,
  submitCustomOffer,
  acceptOffer,
} from '../controllers/customRequest.js';

const router = express.Router();

// Public list & view details
router.get('/', listCustomRequests);
router.get('/:id', getCustomRequestDetails);

// Authenticated actions
router.post('/', authMiddleware, postCustomRequest);
router.post('/:id/offers', authMiddleware, submitCustomOffer);
router.patch('/:id/offers/:offerId/accept', authMiddleware, acceptOffer);

export default router;
