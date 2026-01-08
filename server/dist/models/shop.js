import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const shopsPath = path.join(__dirname, '..', 'shops.json');
export const ShopSchema = z.object({
    name: z.string(),
    address: z.string(),
    lat: z.number(),
    lng: z.number(),
    county: z.string(),
});
export const createShop = async (data) => {
    let shops = [];
    try {
        const shopsData = await fs.readFile(shopsPath, 'utf8');
        shops = JSON.parse(shopsData);
    }
    catch (error) {
        // File might not exist or be empty
        shops = [];
    }
    // Generate Shop Code: DDMMYY-COUNTY-NNN
    const date = new Date();
    const yyyy = date.getFullYear().toString().slice(-2); // YY
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${dd}${mm}${yyyy}`;
    const county = data.county.toUpperCase().replace(/\s+/g, '');
    // Find count of shops in this county
    const countyShops = shops.filter(s => s.county.toUpperCase().replace(/\s+/g, '') === county);
    const sequence = String(countyShops.length + 1).padStart(3, '0');
    const shopCode = `${dateStr}-${county}-${sequence}`;
    const newShop = {
        id: crypto.randomUUID(),
        shopCode,
        name: data.name,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        county: data.county,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    shops.push(newShop);
    await fs.writeFile(shopsPath, JSON.stringify(shops, null, 2));
    return newShop;
};
export const getShops = async () => {
    try {
        const shopsData = await fs.readFile(shopsPath, 'utf8');
        return JSON.parse(shopsData);
    }
    catch (error) {
        return [];
    }
};
export const getNearbyShops = async (location) => {
    try {
        const shopsData = await fs.readFile(shopsPath, 'utf8');
        return JSON.parse(shopsData);
    }
    catch (error) {
        return [];
    }
};
//# sourceMappingURL=shop.js.map