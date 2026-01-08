
import { Request, Response } from 'express';
import { supabase } from '../db';
import axios from 'axios';

// Admin approves sales, awards points
export const approveSale = async (req: Request, res: Response) => {
  try {
    if (!['admin', 'shop', 'technician'].includes(req.user?.role || '')) return res.status(403).json({ error: 'Forbidden' });
    const { saleId, points } = req.body;

    const { data: sale, error } = await supabase
      .from('DeviceSale')
      .update({ status: 'approved', pointsAwarded: points })
      .eq('id', saleId)
      .select('*, user:User(*, wallet:Wallet(*))')
      .single();

    if (error) throw error;

    if (sale.user?.wallet) {
      await supabase.from('Wallet').update({
        points: sale.user.wallet.points + (points || 0)
      }).eq('id', sale.user.wallet.id);
    }
    res.json(sale);
  } catch (err) {
    console.error('Approval failed:', (err as Error).message);
    res.status(500).json({ error: 'Approval failed' });
  }
};

// Approve withdrawal via M-Pesa B2C
export const approveWithdrawal = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { userId, amount, phone } = req.body;

    const { data: user } = await supabase
      .from('User')
      .select('*, wallet:Wallet(*)')
      .eq('id', userId)
      .single();

    if (!user?.wallet || user.wallet.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

    // M-Pesa B2C API call (get access token first)
    const tokenResponse = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      auth: { username: process.env.MPESA_CONSUMER_KEY!, password: process.env.MPESA_CONSUMER_SECRET! },
    });
    const accessToken = tokenResponse.data.access_token;

    const b2cResponse = await axios.post('https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest', {
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

    await supabase.from('Transaction').insert({ walletId: user.wallet.id, type: 'withdrawal', amount });
    await supabase.from('Wallet').update({ balance: user.wallet.balance - amount }).eq('id', user.wallet.id);

    res.json(b2cResponse.data);
  } catch (err) {
    console.error('Withdrawal failed:', (err as Error).message);
    res.status(500).json({ error: 'Withdrawal failed' });
  }
};

// Other admin: manage users, analytics (count repairs, etc.)
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const { count: users } = await supabase.from('User').select('*', { count: 'exact', head: true });
    const { count: repairs } = await supabase.from('RepairRequest').select('*', { count: 'exact', head: true });

    res.json({ users, repairs });
  } catch (err) {
    console.error('Analytics failed:', (err as Error).message);
    res.status(500).json({ error: 'Analytics failed' });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { data, error } = await supabase.from('User').select('*, wallet:Wallet(*)');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
};

export const getPendingSales = async (req: Request, res: Response) => {
  try {
    if (!['admin', 'shop', 'technician'].includes(req.user?.role || '')) return res.status(403).json({ error: 'Forbidden' });
    const { data, error } = await supabase
      .from('DeviceSale')
      .select('*, user:User(*)')
      .eq('status', 'pending');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
};

export const getAllRepairs = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { data, error } = await supabase
      .from('RepairRequest')
      .select('*, user:User(*)');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
};

export const getWithdrawalRequests = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { data, error } = await supabase
      .from('Transaction')
      .select('*, wallet:Wallet(User(*))')
      .eq('type', 'withdrawal_request'); // Assuming this type exists or will be used
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
};