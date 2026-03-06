import { getNearbyShops, getShops, createShop, ShopSchema } from '../models/shop';
export const listShops = async (req, res) => {
    try {
        const shops = await getShops();
        res.json(shops);
    }
    catch (err) {
        console.error('Fetch failed:', err.message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
export const getNearby = async (req, res) => {
    try {
        const { location } = req.query;
        const shops = await getNearbyShops(location);
        res.json(shops);
    }
    catch (err) {
        console.error('Fetch failed:', err.message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
export const registerShop = async (req, res) => {
    try {
        // Assuming admin check is done in middleware
        const data = ShopSchema.parse(req.body);
        const shop = await createShop(data);
        res.json(shop);
    }
    catch (err) {
        console.error('Registration failed:', err.message);
        res.status(500).json({ error: 'Registration failed' });
    }
};
//# sourceMappingURL=shop.js.map