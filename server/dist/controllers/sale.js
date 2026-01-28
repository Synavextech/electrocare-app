"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMySales = exports.createDeviceSale = void 0;
const sale_1 = require("../models/sale");
const createDeviceSale = async (req, res) => {
    try {
        const data = sale_1.SaleSchema.parse(req.body);
        const sale = await (0, sale_1.createSale)({ ...data, userId: req.user.id });
        res.json(sale);
    }
    catch (err) {
        console.error('Sale creation failed:', err.message);
        res.status(500).json({ error: 'Sale creation failed' });
    }
};
exports.createDeviceSale = createDeviceSale;
const getMySales = async (req, res) => {
    try {
        const sales = await (0, sale_1.getSalesByUser)(req.user.id);
        res.json(sales);
    }
    catch (err) {
        console.error('Fetch failed:', err.message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.getMySales = getMySales;
// Approval in admin controller
//# sourceMappingURL=sale.js.map