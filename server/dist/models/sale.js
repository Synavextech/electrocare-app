"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSale = exports.getSalesByUser = exports.createSale = exports.SaleSchema = void 0;
const db_1 = require("../db");
const zod_1 = require("zod");
exports.SaleSchema = zod_1.z.object({
    device: zod_1.z.string(),
    price: zod_1.z.number(),
    description: zod_1.z.string().optional(),
    condition: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().optional(),
    serialNumber: zod_1.z.string().optional(),
});
const createSale = async (data) => {
    const { data: sale, error } = await db_1.supabase
        .from('DeviceSale')
        .insert({
        userId: data.userId,
        device: data.device,
        price: data.price,
        description: data.description,
        condition: data.condition,
        imageUrl: data.imageUrl,
        serialNumber: data.serialNumber,
    })
        .select()
        .single();
    if (error)
        throw error;
    return sale;
};
exports.createSale = createSale;
const getSalesByUser = async (userId) => {
    const { data, error } = await db_1.supabase
        .from('DeviceSale')
        .select('*')
        .eq('userId', userId);
    if (error)
        throw error;
    return data;
};
exports.getSalesByUser = getSalesByUser;
const updateSale = async (id, data) => {
    const { data: sale, error } = await db_1.supabase
        .from('DeviceSale')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return sale;
};
exports.updateSale = updateSale;
// On approval, award points to user via updateUser
//# sourceMappingURL=sale.js.map