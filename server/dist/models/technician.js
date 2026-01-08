import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const techniciansPath = path.join(__dirname, '..', 'technicians.json');
const shopsPath = path.join(__dirname, '..', 'shops.json');
export const getTechniciansByShop = async (shopId) => {
    const data = await fs.readFile(techniciansPath, 'utf8');
    const technicians = JSON.parse(data);
    return technicians.filter(t => t.shopId === shopId);
};
export const getTechnicianById = async (id) => {
    const data = await fs.readFile(techniciansPath, 'utf8');
    const technicians = JSON.parse(data);
    return technicians.find(t => t.id === id) || null;
};
export const createTechnician = async (data) => {
    // This function seems to be for auto-creating a technician profile?
    // Or maybe it was intended to link a user to a technician profile.
    // For now, I'll implement it to add to the JSON file.
    const shopsData = await fs.readFile(shopsPath, 'utf8');
    const shops = JSON.parse(shopsData);
    const shop = shops[0]; // Assign to first shop
    const techniciansData = await fs.readFile(techniciansPath, 'utf8');
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
    await fs.writeFile(techniciansPath, JSON.stringify(technicians, null, 2));
    return newTechnician;
};
//# sourceMappingURL=technician.js.map