"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWallet = exports.getTransactionsByUser = exports.createTransaction = exports.TransactionSchema = void 0;
const db_1 = require("../db");
const zod_1 = require("zod");
exports.TransactionSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    type: zod_1.z.enum(['deposit', 'withdrawal', 'payment', 'redeem']),
});
const createTransaction = async (data) => {
    const { data: tx, error } = await db_1.supabase
        .from('Transaction')
        .insert(data)
        .select()
        .single();
    if (error)
        throw error;
    return tx;
};
exports.createTransaction = createTransaction;
const getTransactionsByUser = async (userId) => {
    const { data: wallet } = await db_1.supabase
        .from('Wallet')
        .select('id')
        .eq('userId', userId)
        .single();
    if (!wallet)
        return [];
    const { data, error } = await db_1.supabase
        .from('Transaction')
        .select('*')
        .eq('walletId', wallet.id);
    if (error)
        throw error;
    return data;
};
exports.getTransactionsByUser = getTransactionsByUser;
const updateWallet = async (userId, data) => {
    const { data: wallet, error } = await db_1.supabase
        .from('Wallet')
        .update(data)
        .eq('userId', userId)
        .select()
        .single();
    if (error)
        throw error;
    return wallet;
};
exports.updateWallet = updateWallet;
//# sourceMappingURL=wallet.js.map