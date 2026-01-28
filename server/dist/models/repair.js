"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRepair = exports.getRepairById = exports.getRepairsByUser = exports.createRepair = exports.RepairSchema = void 0;
const db_1 = require("../db");
const zod_1 = require("zod");
exports.RepairSchema = zod_1.z.object({
    device_type: zod_1.z.string(),
    device_model: zod_1.z.string().optional(),
    issue: zod_1.z.string(),
    delivery: zod_1.z.boolean().optional(),
    shopId: zod_1.z.string().optional(),
    technicianId: zod_1.z.string().optional(),
    deliveryPersonnelId: zod_1.z.string().optional(),
    paymentMethod: zod_1.z.enum(['online', 'cod']).optional(),
});
const createRepair = async (data) => {
    // Generate Device Serialization: EC/YYYYMMDD/NNN
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    // Get count of repairs for today to determine NNN
    const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();
    const { count, error: countError } = await db_1.supabase
        .from('RepairRequest')
        .select('*', { count: 'exact', head: true })
        .gte('createdAt', startOfDay)
        .lte('createdAt', endOfDay);
    if (countError)
        throw countError;
    const sequence = String((count || 0) + 1).padStart(3, '0');
    const request_id = `EC/${dateStr}/${sequence}`;
    // Apply discount if online payment
    let discount = 0;
    if (data.paymentMethod === 'online') {
        discount = 10; // 10% discount logic
    }
    const { data: repair, error } = await db_1.supabase
        .from('RepairRequest')
        .insert({
        request_id,
        userId: data.userId,
        device_type: data.device_type,
        device_model: data.device_model,
        issue: data.issue,
        delivery: data.delivery || false,
        shopId: data.shopId,
        technicianId: data.technicianId,
        deliveryPersonnelId: data.deliveryPersonnelId,
        paymentMethod: data.paymentMethod || 'cod',
        discount: discount,
        status: 'pending'
    })
        .select()
        .single();
    if (error)
        throw error;
    return repair;
};
exports.createRepair = createRepair;
const getRepairsByUser = async (userId) => {
    const { data, error } = await db_1.supabase
        .from('RepairRequest')
        .select('*')
        .eq('userId', userId);
    if (error)
        throw error;
    return data;
};
exports.getRepairsByUser = getRepairsByUser;
const getRepairById = async (id) => {
    const { data, error } = await db_1.supabase
        .from('RepairRequest')
        .select('*')
        .eq('id', id)
        .single();
    if (error)
        throw error;
    return data;
};
exports.getRepairById = getRepairById;
const updateRepair = async (id, data) => {
    const { data: repair, error } = await db_1.supabase
        .from('RepairRequest')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return repair;
};
exports.updateRepair = updateRepair;
//# sourceMappingURL=repair.js.map