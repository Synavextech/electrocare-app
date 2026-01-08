import { supabase } from '../db';
import { z } from 'zod';
export const TransactionSchema = z.object({
    amount: z.number().positive(),
    type: z.enum(['deposit', 'withdrawal', 'payment', 'redeem']),
});
export const createTransaction = async (data) => {
    const { data: tx, error } = await supabase
        .from('Transaction')
        .insert(data)
        .select()
        .single();
    if (error)
        throw error;
    return tx;
};
export const getTransactionsByUser = async (userId) => {
    const { data: wallet } = await supabase
        .from('Wallet')
        .select('id')
        .eq('userId', userId)
        .single();
    if (!wallet)
        return [];
    const { data, error } = await supabase
        .from('Transaction')
        .select('*')
        .eq('walletId', wallet.id);
    if (error)
        throw error;
    return data;
};
export const updateWallet = async (userId, data) => {
    const { data: wallet, error } = await supabase
        .from('Wallet')
        .update(data)
        .eq('userId', userId)
        .select()
        .single();
    if (error)
        throw error;
    return wallet;
};
//# sourceMappingURL=wallet.js.map