import express from 'express';
import { register, login, forgotPassword } from '../controllers/auth';
const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
export default router;
//# sourceMappingURL=auth.js.map