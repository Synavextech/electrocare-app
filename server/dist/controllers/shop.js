"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerShop = exports.getNearby = exports.listShops = void 0;
const shop_1 = require("../models/shop");
const listShops = async (req, res) => {
    try {
        const shops = await (0, shop_1.getShops)();
        res.json(shops);
    }
    catch (err) {
        console.error('Fetch failed:', err.message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.listShops = listShops;
const getNearby = async (req, res) => {
    try {
        const { location } = req.query;
        const shops = await (0, shop_1.getNearbyShops)(location);
        res.json(shops);
    }
    catch (err) {
        console.error('Fetch failed:', err.message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.getNearby = getNearby;
const registerShop = async (req, res) => {
    try {
        // Assuming admin check is done in middleware
        const data = shop_1.ShopSchema.parse(req.body);
        const shop = await (0, shop_1.createShop)(data);
        res.json(shop);
    }
    catch (err) {
        console.error('Registration failed:', err.message);
        res.status(500).json({ error: 'Registration failed' });
    }
};
exports.registerShop = registerShop;
//# sourceMappingURL=shop.js.map