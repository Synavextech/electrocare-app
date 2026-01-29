import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initSocket } from './socket';
import authRoutes from './routes/auth';
import repairsRoutes from './routes/repairs';
import marketplaceRoutes from './routes/marketplace';
import uploadRoutes from './routes/upload';
import walletRoutes from './routes/wallet';
import recruitmentRoutes from './routes/recruitment';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notification';
import shopRoutes from './routes/shop';
import technicianRoutes from './routes/technician';
import saleRoutes from './routes/sale';
import authMiddleware from './middleware/auth';

const isDist = __dirname.endsWith('dist');
const reqPath = isDist ? '../..' : '..';

interface Shop {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  county: string;
  services?: string[];
  // Add other properties as needed
}

interface Technician {
  id: string;
  name: string;
  phone: string;
  isTrained: boolean;
  referral: string;
  shopId: string;
}

const rootDir = isDist ? path.join(__dirname, '../../') : path.join(__dirname, '../');
dotenv.config({ path: path.join(rootDir, '.env') });
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

const distPath = path.join(__dirname, reqPath, 'dist');

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
app.use('/api/auth', authRoutes);
app.use('/api/repairs', authMiddleware, repairsRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/shops', shopRoutes); // plural as expected by frontend
app.use('/api/technician', technicianRoutes);
app.use('/api/sales', authMiddleware, saleRoutes);


app.get('/api/device-types', async (req, res) => {
  try {
    const typesPath = path.join(__dirname, 'repairabledevices.json');
    const data = await fs.readFile(typesPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load device types' });
  }
});

app.get('/api/models', async (req, res) => {
  try {
    const modelsPath = path.join(__dirname, 'repairableModels.json');
    const data = await fs.readFile(modelsPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load models' });
  }
});

app.post('/api/admin/models', authMiddleware, async (req, res) => {
  try {
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const modelsPath = path.join(__dirname, 'repairableModels.json');
    await fs.writeFile(modelsPath, JSON.stringify(req.body, null, 2));
    res.json({ message: 'Models updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update models' });
  }
});

// Delivery personnel endpoint (kept inline for now as no route file exists)
app.get('/api/delivery-personnel', async (req, res) => {
  try {
    const { shopId } = req.query;
    const dpPath = path.join(__dirname, 'deliverypersonnel.json');
    const data = await fs.readFile(dpPath, 'utf8');
    let personnel = JSON.parse(data);

    if (shopId) {
      personnel = personnel.filter((p: any) => p.shopId === shopId);
    }

    res.json(personnel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load delivery personnel' });
  }
});

app.post('/api/technicians', authMiddleware, async (req, res) => {
  try {
    // Assuming admin or shop owner can create technicians
    if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const { name, phone, isTrained, referral, shopId } = req.body;
    const techniciansPath = path.join(__dirname, 'technicians.json');
    const data = await fs.readFile(techniciansPath, 'utf8');
    const technicians: Technician[] = JSON.parse(data);

    const newTechnician: Technician = {
      id: crypto.randomUUID(),
      name,
      phone,
      isTrained,
      referral,
      shopId
    };

    technicians.push(newTechnician);
    await fs.writeFile(techniciansPath, JSON.stringify(technicians, null, 2));
    res.json(newTechnician);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create technician' });
  }
});

// Shop services endpoints
app.get('/api/shop/:id/services', async (req, res) => {
  try {
    const shopsPath = path.join(__dirname, 'shops.json');
    const data = await fs.readFile(shopsPath, 'utf8');
    const shops: Shop[] = JSON.parse(data);
    const shop = shops.find(s => s.id === req.params.id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop.services || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.post('/api/shop/:id/services', authMiddleware, async (req, res) => {
  try {
    const shopsPath = path.join(__dirname, 'shops.json');
    const data = await fs.readFile(shopsPath, 'utf8');
    const shops: Shop[] = JSON.parse(data);
    const shopIndex = shops.findIndex(s => s.id === req.params.id);

    if (shopIndex === -1) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Check permissions
    if (req.user!.role !== 'admin' && req.user!.id !== shops[shopIndex].id) { // Assuming shop ID matches user ID for shop owners? Or just admin
      // If shop owner logic is different, adjust here. For now, strict admin or matching ID if shop is user
      if (req.user!.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    }

    const { models } = req.body;
    shops[shopIndex].services = models;

    await fs.writeFile(shopsPath, JSON.stringify(shops, null, 2));
    res.json({ message: 'Services updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update services' });
  }
});

app.post('/api/delivery-persons', authMiddleware, async (req, res) => {
  // Delivery persons also likely in a JSON or just users with role
  // For now, implementing as JSON if needed, or just skipping as user didn't specify delivery person JSON
  res.status(501).json({ error: 'Not implemented yet' });
});

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

const PORT = process.env.PORT || 5000;
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