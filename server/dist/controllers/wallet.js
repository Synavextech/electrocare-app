import { createTransaction, getTransactionsByUser } from '../models/wallet';
import { getUserById } from '../models/user';
import { supabase } from '../db';
export const getWallet = async (req, res) => {
    try {
        const user = await getUserById(req.user.id);
        if (!user?.wallet)
            return res.status(404).json({ error: 'Wallet not found' });
        const transactions = await getTransactionsByUser(req.user.id);
        res.json({
            balance: user.wallet.balance,
            points: user.wallet.points,
            electroCoins: user.wallet.electroCoins || 0,
            transactions
        });
    }
    catch (err) {
        console.error('Fetch failed:', err.message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};
export const redeemPoints = async (req, res) => {
    try {
        const user = await getUserById(req.user.id);
        if (!user?.wallet || user.wallet.points < 10)
            return res.status(400).json({ error: 'Insufficient points' });
        const { error } = await supabase
            .from('Wallet')
            .update({
            points: user.wallet.points - 10,
            balance: user.wallet.balance + 10
        })
            .eq('userId', user.id);
        if (error)
            throw error;
        await createTransaction({ walletId: user.wallet.id, type: 'redeem', amount: 10 });
        res.json({ success: true });
    }
    catch (err) {
        console.error('Redeem failed:', err.message);
        res.status(500).json({ error: 'Redeem failed' });
    }
};
export const requestWithdrawal = async (req, res) => {
    try {
        const { amount, method } = req.body; // method: 'mpesa', 'bank', etc.
        if (!amount || !method) {
            return res.status(400).json({ error: 'Amount and withdrawal method required' });
        }
        const user = await getUserById(req.user.id);
        if (!user?.wallet)
            return res.status(404).json({ error: 'Wallet not found' });
        // Validate minimum withdrawal
        if (amount < 10) {
            return res.status(400).json({ error: 'Minimum withdrawal is $10' });
        }
        // Check sufficient balance
        if (user.wallet.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        // Create withdrawal request (pending admin approval)
        const tx = await createTransaction({
            walletId: user.wallet.id,
            type: `withdrawal_${method}`, // e.g., 'withdrawal_mpesa'
            amount
        });
        res.json({ message: 'Withdrawal request submitted for admin approval', transaction: tx });
    }
    catch (err) {
        console.error('Request failed:', err.message);
        res.status(500).json({ error: 'Request failed' });
    }
};
// Redeem Electro-Coins for cash (Admin controlled)
export const redeemElectroCoins = async (req, res) => {
    try {
        const { amount } = req.body; // Amount of coins to redeem
        const user = await getUserById(req.user.id);
        if (!user?.wallet)
            return res.status(404).json({ error: 'Wallet not found' });
        // Check sufficient coins
        if ((user.wallet.electroCoins || 0) < amount) {
            return res.status(400).json({ error: 'Insufficient electro-coins' });
        }
        // Conversion rate: 1 coin = $1 (or as per business logic)
        const cashValue = amount;
        // Deduct coins and add to balance
        const { error } = await supabase
            .from('Wallet')
            .update({
            electroCoins: (user.wallet.electroCoins || 0) - amount,
            balance: user.wallet.balance + cashValue
        })
            .eq('userId', user.id);
        if (error)
            throw error;
        await createTransaction({
            walletId: user.wallet.id,
            type: 'electro_coin_redemption',
            amount: cashValue
        });
        res.json({ success: true, message: `Redeemed ${amount} electro-coins for $${cashValue}` });
    }
    catch (err) {
        console.error('Redemption failed:', err.message);
        res.status(500).json({ error: 'Redemption failed' });
    }
};
export const topUpWallet = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0)
            return res.status(400).json({ error: 'Invalid amount' });
        const user = await getUserById(req.user.id);
        if (!user?.wallet)
            return res.status(404).json({ error: 'Wallet not found' });
        const { data: wallet, error } = await supabase
            .from('Wallet')
            .update({ balance: user.wallet.balance + amount })
            .eq('userId', user.id)
            .select()
            .single();
        if (error)
            throw error;
        await createTransaction({
            walletId: user.wallet.id,
            type: 'top_up',
            amount
        });
        res.json(wallet);
    }
    catch (err) {
        console.error('Top-up failed:', err.message);
        res.status(500).json({ error: 'Top-up failed' });
    }
};
//# sourceMappingURL=wallet.js.map