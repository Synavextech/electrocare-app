import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  initiatePayment,
  checkPaymentStatus,
  handleMpesaCallback,
  payListingFeeWithWallet
} from '../controllers/payment.js';

const router = express.Router();

// Public webhook callback from Safaricom Daraja
router.post('/callback', handleMpesaCallback);

// Authenticated payment actions
router.post('/stkpush', authMiddleware, initiatePayment);
router.get('/status/:checkoutRequestId', authMiddleware, checkPaymentStatus);
router.post('/listing-fee/wallet', authMiddleware, payListingFeeWithWallet);

export default router;
