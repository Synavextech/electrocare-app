import express from 'express';

import { supabase } from '../db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { z } from 'zod';

import { register, login, forgotPassword } from '../controllers/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);

export default router;