import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: resolveFromRoot('.env') });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs/promises';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initSocket } from './socket.js';
import authMiddleware from './middleware/auth.js';
import { roleCheck } from './middleware/roleCheck.js';
import { DATA_PATHS, resolveFromRoot } from './utils/paths.js';
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

// Handle SPA routing
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Routes
app.use('/api', commonRoutes); // device-types, models
app.use('/api/auth', authRoutes);
app.use('/api/repairs', authMiddleware, repairsRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/wallet', authMiddleware, walletRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/admin', authMiddleware, roleCheck(['admin']), adminRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/technician', authMiddleware, technicianRoutes);
app.use('/api/sales', authMiddleware, saleRoutes);


import { getDeviceTypes, getDeviceModels, updateDeviceModelsBulk } from './models/deviceInfo.js';
import { getDeliveryPersonnelByShop } from './models/delivery.js';
import { createTechnician } from './models/technician.js';
import { getShopByCode, updateShopServices } from './models/shop.js';

// ... (keep middle logic until app.use routes)

// Remove inline route definitions that are now in commonRoutes or other route files

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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