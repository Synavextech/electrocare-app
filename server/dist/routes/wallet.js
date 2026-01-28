"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
// Get wallet balance and points
router.get('/', auth_1.default, async (req, res) => {
    try {
        const { data: wallet, error } = await db_1.supabase
            .from('Wallet')
            .select('*')
            .eq('userId', req.user.id)
            .single();
        if (error) {
            if (error.code === 'PGRST116') { // Not found
                // Create wallet if it doesn't exist
                const { data: newWallet, error: createError } = await db_1.supabase
                    .from('Wallet')
                    .insert({ userId: req.user.id, balance: 0, points: 0 })
                    .select()
                    .single();
                if (createError)
                    throw createError;
                return res.json(newWallet);
            }
            throw error;
        }
        res.json(wallet);
    }
    catch (error) {
        console.error('Error fetching wallet:', error);
        res.status(500).json({ error: 'Failed to fetch wallet' });
    }
});
// Get transaction history
router.get('/transactions', auth_1.default, async (req, res) => {
    try {
        // First get wallet ID
        const { data: wallet, error: walletError } = await db_1.supabase
            .from('Wallet')
            .select('id')
            .eq('userId', req.user.id)
            .single();
        if (walletError && walletError.code !== 'PGRST116')
            throw walletError;
        if (!wallet)
            return res.json([]);
        const { data: transactions, error } = await db_1.supabase
            .from('Transaction')
            .select('*')
            .eq('walletId', wallet.id)
            .order('createdAt', { ascending: false });
        if (error)
            throw error;
        res.json(transactions);
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});
// Redeem points (placeholder logic)
router.post('/redeem', auth_1.default, async (req, res) => {
    try {
        const { data: wallet, error: walletError } = await db_1.supabase
            .from('Wallet')
            .select('*')
            .eq('userId', req.user.id)
            .single();
        if (walletError)
            throw walletError;
        if (wallet.points < 100) {
            return res.status(400).json({ error: 'Insufficient points (min 100 required)' });
        }
        const redemptionAmount = Math.floor(wallet.points / 100); // 100 pts = $1
        const remainingPoints = wallet.points % 100;
        // Start transaction (manual update)
        const { error: updateError } = await db_1.supabase
            .from('Wallet')
            .update({
            points: remainingPoints,
            balance: Number(wallet.balance) + redemptionAmount
        })
            .eq('id', wallet.id);
        if (updateError)
            throw updateError;
        // Add transaction record
        await db_1.supabase.from('Transaction').insert({
            walletId: wallet.id,
            amount: redemptionAmount,
            type: 'POINTS',
            description: `Redeemed ${wallet.points - remainingPoints} points`
        });
        res.json({ message: 'Points redeemed successfully', amount: redemptionAmount });
    }
    catch (error) {
        console.error('Error redeeming points:', error);
        res.status(500).json({ error: 'Failed to redeem points' });
    }
});
exports.default = router;
//# sourceMappingURL=wallet.js.map