"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNearbyShops = exports.getShops = exports.createShop = exports.ShopSchema = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
const shopsPath = path_1.default.join(__dirname, '..', 'shops.json');
exports.ShopSchema = zod_1.z.object({
    name: zod_1.z.string(),
    address: zod_1.z.string(),
    lat: zod_1.z.number(),
    lng: zod_1.z.number(),
    county: zod_1.z.string(),
});
const createShop = async (data) => {
    let shops = [];
    try {
        const shopsData = await promises_1.default.readFile(shopsPath, 'utf8');
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
    await promises_1.default.writeFile(shopsPath, JSON.stringify(shops, null, 2));
    return newShop;
};
exports.createShop = createShop;
const getShops = async () => {
    try {
        const shopsData = await promises_1.default.readFile(shopsPath, 'utf8');
        return JSON.parse(shopsData);
    }
    catch (error) {
        return [];
    }
};
exports.getShops = getShops;
const getNearbyShops = async (location) => {
    try {
        const shopsData = await promises_1.default.readFile(shopsPath, 'utf8');
        return JSON.parse(shopsData);
    }
    catch (error) {
        return [];
    }
};
exports.getNearbyShops = getNearbyShops;
//# sourceMappingURL=shop.js.map