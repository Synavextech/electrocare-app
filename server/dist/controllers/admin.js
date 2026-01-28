"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectRoleApplication = exports.approveRoleApplication = exports.getRoleApplications = exports.approvePurchase = exports.getPurchaseRequests = exports.getWithdrawalRequests = exports.getAllRepairs = exports.getPendingSales = exports.getUsers = exports.getAnalytics = exports.approveWithdrawal = exports.rejectSale = exports.approveSale = void 0;
const db_1 = require("../db");
const axios_1 = __importDefault(require("axios"));
const roleApplication_1 = require("../models/roleApplication");
// Admin approves sales, awards points
const approveSale = async (req, res) => {
    try {
        if (!['admin', 'shop', 'technician'].includes(req.user?.role || ''))
            return res.status(403).json({ error: 'Forbidden' });
        const { saleId, points } = req.body;
        const { data: sale, error } = await db_1.supabase
            .from('DeviceSale')
            .update({ status: 'approved', pointsAwarded: points })
            .eq('id', saleId)
            .select('*, user:User(*, wallet:Wallet(*))')
            .single();
        if (error)
            throw error;
        if (sale.user?.wallet) {
            await db_1.supabase.from('Wallet').update({
                points: sale.user.wallet.points + (points || 0)
            }).eq('id', sale.user.wallet.id);
        }
        res.json(sale);
    }
    catch (err) {
        console.error('Approval failed:', err.message);
        res.status(500).json({ error: 'Approval failed' });
    }
};
exports.approveSale = approveSale;
const rejectSale = async (req, res) => {
    try {
        if (!['admin', 'shop', 'technician'].includes(req.user?.role || ''))
            return res.status(403).json({ error: 'Forbidden' });
        const { saleId, reason } = req.body;
        const { data, error } = await db_1.supabase
            .from('DeviceSale')
            .update({ status: 'rejected', rejectionReason: reason })
            .eq('id', saleId)
            .select()
            .single();
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Rejection failed' });
    }
};
exports.rejectSale = rejectSale;
// Approve withdrawal via M-Pesa B2C
const approveWithdrawal = async (req, res) => {
    try {
        if (req.user?.role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });
        const { userId, amount, phone } = req.body;
        const { data: user } = await db_1.supabase
            .from('User')
            .select('*, wallet:Wallet(*)')
            .eq('id', userId)
            .single();
        if (!user?.wallet || user.wallet.balance < amount)
            return res.status(400).json({ error: 'Insufficient balance' });
        // M-Pesa B2C API call (get access token first)
        const tokenResponse = await axios_1.default.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            auth: { username: process.env.MPESA_CONSUMER_KEY, password: process.env.MPESA_CONSUMER_SECRET },
        });
        const accessToken = tokenResponse.data.access_token;
        const b2cResponse = await axios_1.default.post('https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest', {
            InitiatorName: 'testapi',
            SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL, // Generate via cert
            CommandID: 'BusinessPayment',
            Amount: amount,
            PartyA: process.env.MPESA_SHORTCODE,
            PartyB: phone,
            Remarks: 'Withdrawal',
            QueueTimeOutURL: 'https://your-callback/timeout',
            ResultURL: 'https://your-callback/result',
            Occasion: 'ElectroCare Withdrawal',
        }, { headers: { Authorization: `Bearer ${accessToken} ` } });
        await db_1.supabase.from('Transaction').insert({ walletId: user.wallet.id, type: 'withdrawal', amount });
        await db_1.supabase.from('Wallet').update({ balance: user.wallet.balance - amount }).eq('id', user.wallet.id);
        res.json(b2cResponse.data);
    }
    catch (err) {
        console.error('Withdrawal failed:', err.message);
        res.status(500).json({ error: 'Withdrawal failed' });
    }
};
exports.approveWithdrawal = approveWithdrawal;
// Other admin: manage users, analytics (count repairs, etc.)
const getAnalytics = async (req, res) => {
    try {
        if (req.user?.role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });
        const { count: users } = await db_1.supabase.from('User').select('*', { count: 'exact', head: true });
        const { count: repairs } = await db_1.supabase.from('RepairRequest').select('*', { count: 'exact', head: true });
        res.json({ users, repairs });
    }
    catch (err) {
        console.error('Analytics failed:', err.message);
        res.status(500).json({ error: 'Analytics failed' });
    }
};
exports.getAnalytics = getAnalytics;
const getUsers = async (req, res) => {
    try {
        if (req.user?.role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });
        const { data, error } = await db_1.supabase.from('User').select('*, wallet:Wallet(*)');
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.getUsers = getUsers;
const getPendingSales = async (req, res) => {
    try {
        if (!['admin', 'shop', 'technician'].includes(req.user?.role || ''))
            return res.status(403).json({ error: 'Forbidden' });
        const { data, error } = await db_1.supabase
            .from('DeviceSale')
            .select('*, user:User(*)')
            .eq('status', 'pending');
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.getPendingSales = getPendingSales;
const getAllRepairs = async (req, res) => {
    try {
        if (req.user?.role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });
        const { data, error } = await db_1.supabase
            .from('RepairRequest')
            .select('*, user:User(*)');
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.getAllRepairs = getAllRepairs;
const getWithdrawalRequests = async (req, res) => {
    try {
        if (req.user?.role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });
        const { data, error } = await db_1.supabase
            .from('Transaction')
            .select('*, wallet:Wallet(User(*))')
            .eq('type', 'withdrawal_request'); // Assuming this type exists or will be used
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.getWithdrawalRequests = getWithdrawalRequests;
const getPurchaseRequests = async (req, res) => {
    try {
        if (req.user?.role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });
        const { data, error } = await db_1.supabase
            .from('DevicePurchase')
            .select('*, buyer:User(*), sale:DeviceSale(*, user:User(*))')
            .eq('status', 'pending');
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.getPurchaseRequests = getPurchaseRequests;
const approvePurchase = async (req, res) => {
    try {
        if (req.user?.role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });
        const { purchaseId } = req.body;
        // 1. Get purchase details
        const { data: purchase, error: pError } = await db_1.supabase
            .from('DevicePurchase')
            .select('*, buyer:User(*), sale:DeviceSale(*)')
            .eq('id', purchaseId)
            .single();
        if (pError || !purchase)
            throw pError || new Error('Purchase not found');
        // 2. Update status
        await db_1.supabase.from('DevicePurchase').update({ status: 'approved' }).eq('id', purchaseId);
        await db_1.supabase.from('DeviceSale').update({ status: 'sold' }).eq('id', purchase.saleId);
        // 3. Logic for fund transfer could go here (e.g. updating wallets)
        // For now, just completing the status cycle.
        res.json({ success: true });
    }
    catch (err) {
        console.error('Purchase approval failed:', err.message);
        res.status(500).json({ error: 'Approval failed' });
    }
};
exports.approvePurchase = approvePurchase;
const getRoleApplications = async (req, res) => {
    try {
        if (req.user?.role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });
        const { data, error } = await db_1.supabase
            .from('RoleApplication')
            .select('*, user:User(*)')
            .eq('status', 'pending');
        if (error)
            throw error;
        res.json(data);
    }
    catch (err) {
        res.status(500).json({ error: 'Fetch failed' });
    }
};
exports.getRoleApplications = getRoleApplications;
const approveRoleApplication = async (req, res) => {
    try {
        if (req.user?.role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });
        const { applicationId } = req.body;
        const { data: application, error: aError } = await db_1.supabase
            .from('RoleApplication')
            .select('*')
            .eq('id', applicationId)
            .single();
        if (aError || !application)
            throw aError || new Error('Application not found');
        // 1. Update application status
        await (0, roleApplication_1.updateApplicationStatus)(applicationId, 'approved');
        // 2. Update user role
        const { error: uError } = await db_1.supabase
            .from('User')
            .update({ role: application.requestedRole })
            .eq('id', application.userId);
        if (uError)
            throw uError;
        res.json({ success: true, message: `Role ${application.requestedRole} approved for user` });
    }
    catch (err) {
        console.error('Role approval failed:', err.message);
        res.status(500).json({ error: 'Approval failed' });
    }
};
exports.approveRoleApplication = approveRoleApplication;
const rejectRoleApplication = async (req, res) => {
    try {
        if (req.user?.role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });
        const { applicationId, reason } = req.body;
        await (0, roleApplication_1.updateApplicationStatus)(applicationId, 'rejected');
        // Optionally log rejection reason in RoleApplication notes or another table
        if (reason) {
            await db_1.supabase
                .from('RoleApplication')
                .update({ notes: reason })
                .eq('id', applicationId);
        }
        res.json({ success: true, message: 'Application rejected' });
    }
    catch (err) {
        console.error('Role rejection failed:', err.message);
        res.status(500).json({ error: 'Rejection failed' });
    }
};
exports.rejectRoleApplication = rejectRoleApplication;
//# sourceMappingURL=admin.js.map