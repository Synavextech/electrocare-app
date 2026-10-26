import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { resolveFromRoot } from './utils/paths.js';

// Ensure .env is loaded whether running from project root or server directory
dotenv.config({ path: resolveFromRoot('.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initSocket } from './socket.js';
import authMiddleware from './middleware/auth.js';
import commonRoutes from './routes/common.js';

import authRoutes from './routes/auth.js';
import repairsRoutes from './routes/repairs.js';
import marketplaceRoutes from './routes/marketplace.js';
import uploadRoutes from './routes/upload.js';
import walletRoutes from './routes/wallet.js';
import recruitmentRoutes from './routes/recruitment.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notification.js';
import shopRoutes from './routes/shop.js';
import technicianRoutes from './routes/technician.js';
import saleRoutes from './routes/sale.js';
import trackingRoutes from './routes/tracking.js';
import usersRoutes from './routes/users.js';
import paymentRoutes from './routes/payments.js';
import customRequestRoutes from './routes/customRequests.js';
import serviceInquiryRoutes from './routes/serviceInquiry.js';

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3001',
    'http://localhost:3001'
  ];

console.log('Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS Rejecting Origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const distPath = resolveFromRoot('dist');

// Serve static files from dist
app.use(express.static(distPath));

// Routes
app.use('/api', commonRoutes); // device-types, models, delivery-personnel
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/repairs', authMiddleware, repairsRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/wallet', authMiddleware, walletRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/technician', technicianRoutes);
app.use('/api/sales', authMiddleware, saleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/custom-requests', customRequestRoutes);
app.use('/api/service-inquiries', serviceInquiryRoutes);

// Catch unmatched /api routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

initSocket(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, io };