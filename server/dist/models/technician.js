"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTechnician = exports.getTechnicianById = exports.getTechniciansByShop = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const techniciansPath = path_1.default.join(__dirname, '..', 'technicians.json');
const shopsPath = path_1.default.join(__dirname, '..', 'shops.json');
const getTechniciansByShop = async (shopId) => {
    const data = await promises_1.default.readFile(techniciansPath, 'utf8');
    const technicians = JSON.parse(data);
    if (!shopId)
        return technicians;
    return technicians.filter(t => t.shopId === shopId);
};
exports.getTechniciansByShop = getTechniciansByShop;
const getTechnicianById = async (id) => {
    const data = await promises_1.default.readFile(techniciansPath, 'utf8');
    const technicians = JSON.parse(data);
    return technicians.find(t => t.id === id) || null;
};
exports.getTechnicianById = getTechnicianById;
const createTechnician = async (data) => {
    // This function seems to be for auto-creating a technician profile?
    // Or maybe it was intended to link a user to a technician profile.
    // For now, I'll implement it to add to the JSON file.
    const shopsData = await promises_1.default.readFile(shopsPath, 'utf8');
    const shops = JSON.parse(shopsData);
    const shop = shops[0]; // Assign to first shop
    const techniciansData = await promises_1.default.readFile(techniciansPath, 'utf8');
    const technicians = JSON.parse(techniciansData);
    const newTechnician = {
        id: crypto.randomUUID(),
        name: 'Pending',
        phone: 'Pending',
        isTrained: false,
        referral: 'Pending',
        shopId: shop ? shop.id : 'unknown',
    };
    technicians.push(newTechnician);
    await promises_1.default.writeFile(techniciansPath, JSON.stringify(technicians, null, 2));
    return newTechnician;
};
exports.createTechnician = createTechnician;
//# sourceMappingURL=technician.js.map