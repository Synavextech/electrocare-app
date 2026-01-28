"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const socket_1 = require("./socket");
const auth_1 = __importDefault(require("./routes/auth"));
const repairs_1 = __importDefault(require("./routes/repairs"));
const marketplace_1 = __importDefault(require("./routes/marketplace"));
const upload_1 = __importDefault(require("./routes/upload"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const recruitment_1 = __importDefault(require("./routes/recruitment"));
const admin_1 = __importDefault(require("./routes/admin"));
const notification_1 = __importDefault(require("./routes/notification"));
const shop_1 = __importDefault(require("./routes/shop"));
const technician_1 = __importDefault(require("./routes/technician"));
const sale_1 = __importDefault(require("./routes/sale"));
const auth_2 = __importDefault(require("./middleware/auth"));
const isDist = __dirname.endsWith('dist');
const reqPath = isDist ? '../..' : '..';
dotenv_1.default.config({ path: path_1.default.join(__dirname, reqPath) });
const app = (0, express_1.default)();
exports.app = app;
const allowedOrigins = [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3001',
    'http://localhost:3001'
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
const distPath = path_1.default.join(__dirname, reqPath, 'dist');
// Serve static files from dist
app.use(express_1.default.static(distPath));
// Handle SPA routing
app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
        return next();
    }
    res.sendFile(path_1.default.join(distPath, 'index.html'));
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/repairs', auth_2.default, repairs_1.default);
app.use('/api/marketplace', marketplace_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/wallet', wallet_1.default);
app.use('/api/recruitment', recruitment_1.default);
app.use('/api/admin', auth_2.default, admin_1.default);
app.use('/api/notifications', auth_2.default, notification_1.default);
app.use('/api/shops', shop_1.default); // plural as expected by frontend
app.use('/api/technician', technician_1.default);
app.use('/api/sales', auth_2.default, sale_1.default);
app.get('/api/device-types', async (req, res) => {
    try {
        const typesPath = path_1.default.join(__dirname, 'repairabledevices.json');
        const data = await promises_1.default.readFile(typesPath, 'utf8');
        res.json(JSON.parse(data));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load device types' });
    }
});
app.get('/api/models', async (req, res) => {
    try {
        const modelsPath = path_1.default.join(__dirname, 'repairableModels.json');
        const data = await promises_1.default.readFile(modelsPath, 'utf8');
        res.json(JSON.parse(data));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load models' });
    }
});
app.post('/api/admin/models', auth_2.default, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const modelsPath = path_1.default.join(__dirname, 'repairableModels.json');
        await promises_1.default.writeFile(modelsPath, JSON.stringify(req.body, null, 2));
        res.json({ message: 'Models updated successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update models' });
    }
});
// Delivery personnel endpoint (kept inline for now as no route file exists)
app.get('/api/delivery-personnel', async (req, res) => {
    try {
        const { shopId } = req.query;
        const dpPath = path_1.default.join(__dirname, 'deliverypersonnel.json');
        const data = await promises_1.default.readFile(dpPath, 'utf8');
        let personnel = JSON.parse(data);
        if (shopId) {
            personnel = personnel.filter((p) => p.shopId === shopId);
        }
        res.json(personnel);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load delivery personnel' });
    }
});
app.post('/api/technicians', auth_2.default, async (req, res) => {
    try {
        // Assuming admin or shop owner can create technicians
        if (req.user.role !== 'admin')
            return res.status(403).json({ error: 'Unauthorized' });
        const { name, phone, isTrained, referral, shopId } = req.body;
        const techniciansPath = path_1.default.join(__dirname, 'technicians.json');
        const data = await promises_1.default.readFile(techniciansPath, 'utf8');
        const technicians = JSON.parse(data);
        const newTechnician = {
            id: crypto.randomUUID(),
            name,
            phone,
            isTrained,
            referral,
            shopId
        };
        technicians.push(newTechnician);
        await promises_1.default.writeFile(techniciansPath, JSON.stringify(technicians, null, 2));
        res.json(newTechnician);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create technician' });
    }
});
// Shop services endpoints
app.get('/api/shop/:id/services', async (req, res) => {
    try {
        const shopsPath = path_1.default.join(__dirname, 'shops.json');
        const data = await promises_1.default.readFile(shopsPath, 'utf8');
        const shops = JSON.parse(data);
        const shop = shops.find(s => s.id === req.params.id);
        if (!shop)
            return res.status(404).json({ error: 'Shop not found' });
        res.json(shop.services || []);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});
app.post('/api/shop/:id/services', auth_2.default, async (req, res) => {
    try {
        const shopsPath = path_1.default.join(__dirname, 'shops.json');
        const data = await promises_1.default.readFile(shopsPath, 'utf8');
        const shops = JSON.parse(data);
        const shopIndex = shops.findIndex(s => s.id === req.params.id);
        if (shopIndex === -1) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        // Check permissions
        if (req.user.role !== 'admin' && req.user.id !== shops[shopIndex].id) { // Assuming shop ID matches user ID for shop owners? Or just admin
            // If shop owner logic is different, adjust here. For now, strict admin or matching ID if shop is user
            if (req.user.role !== 'admin')
                return res.status(403).json({ error: 'Unauthorized' });
        }
        const { models } = req.body;
        shops[shopIndex].services = models;
        await promises_1.default.writeFile(shopsPath, JSON.stringify(shops, null, 2));
        res.json({ message: 'Services updated' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update services' });
    }
});
app.post('/api/delivery-persons', auth_2.default, async (req, res) => {
    // Delivery persons also likely in a JSON or just users with role
    // For now, implementing as JSON if needed, or just skipping as user didn't specify delivery person JSON
    res.status(501).json({ error: 'Not implemented yet' });
});
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});
const PORT = process.env.PORT || 5000;
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
exports.io = io;
(0, socket_1.initSocket)(io);
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=app.js.map