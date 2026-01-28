"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.getUserById = exports.getUserByEmail = exports.createUser = exports.UserSchema = void 0;
const db_1 = require("../db");
const zod_1 = require("zod");
exports.UserSchema = zod_1.z.object({
    name: zod_1.z.string(),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(['user', 'technician', 'delivery', 'admin', 'shop']).optional(),
});
const createUser = async (data) => {
    // This is now handled by Supabase Auth and Triggers.
    // But if we need to manually create a user (e.g. admin creating another admin), we use service role.
    // For normal signup, the controller should use supabase.auth.signUp
    // This function might be used by the seed script or tests.
    // We'll assume it's for creating a profile if it doesn't exist, or just returning the profile.
    return (0, exports.getUserByEmail)(data.email);
};
exports.createUser = createUser;
const getUserByEmail = async (email) => {
    const { data, error } = await db_1.supabase
        .from('User')
        .select('*, wallet:Wallet(*)')
        .eq('email', email)
        .single();
    if (error)
        return null;
    return data;
};
exports.getUserByEmail = getUserByEmail;
const getUserById = async (id) => {
    const { data, error } = await db_1.supabase
        .from('User')
        .select('*, wallet:Wallet(*)')
        .eq('id', id)
        .single();
    if (error)
        return null;
    return data;
};
exports.getUserById = getUserById;
const updateUser = async (id, data) => {
    const { data: updatedUser, error } = await db_1.supabase
        .from('User')
        .update({
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
    })
        .eq('id', id)
        .select('*, wallet:Wallet(*)')
        .single();
    if (error)
        throw error;
    return updatedUser;
};
exports.updateUser = updateUser;
//# sourceMappingURL=user.js.map