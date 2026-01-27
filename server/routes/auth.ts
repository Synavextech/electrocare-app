import express from 'express';
import { register, login, forgotPassword, logout, getMe } from '../controllers/auth';
import authMiddleware from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);
router.post('/forgot-password', forgotPassword);

export default router;