
import { Request, Response } from 'express';
import { supabase } from '../db';
import axios from 'axios';
import { updateApplicationStatus } from '../models/roleApplication';

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

export const rejectSale = async (req: Request, res: Response) => {
  try {
    if (!['admin', 'shop', 'technician'].includes(req.user?.role || '')) return res.status(403).json({ error: 'Forbidden' });
    const { saleId, reason } = req.body;

    const { data, error } = await supabase
      .from('DeviceSale')
      .update({ status: 'rejected', rejectionReason: reason })
      .eq('id', saleId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Rejection failed' });
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

export const getPurchaseRequests = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { data, error } = await supabase
      .from('DevicePurchase')
      .select('*, buyer:User(*), sale:DeviceSale(*, user:User(*))')
      .eq('status', 'pending');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
};

export const approvePurchase = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { purchaseId } = req.body;

    // 1. Get purchase details
    const { data: purchase, error: pError } = await supabase
      .from('DevicePurchase')
      .select('*, buyer:User(*), sale:DeviceSale(*)')
      .eq('id', purchaseId)
      .single();

    if (pError || !purchase) throw pError || new Error('Purchase not found');

    // 2. Update status
    await supabase.from('DevicePurchase').update({ status: 'approved' }).eq('id', purchaseId);
    await supabase.from('DeviceSale').update({ status: 'sold' }).eq('id', purchase.saleId);

    // 3. Logic for fund transfer could go here (e.g. updating wallets)
    // For now, just completing the status cycle.

    res.json({ success: true });
  } catch (err) {
    console.error('Purchase approval failed:', (err as Error).message);
    res.status(500).json({ error: 'Approval failed' });
  }
};

export const getRoleApplications = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { data, error } = await supabase
      .from('RoleApplication')
      .select('*, user:User(*)')
      .eq('status', 'pending');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
};

export const approveRoleApplication = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { applicationId } = req.body;

    const { data: application, error: aError } = await supabase
      .from('RoleApplication')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (aError || !application) throw aError || new Error('Application not found');

    // 1. Update application status
    await updateApplicationStatus(applicationId, 'approved');

    // 2. Update user role
    const { error: uError } = await supabase
      .from('User')
      .update({ role: application.requestedRole })
      .eq('id', application.userId);

    if (uError) throw uError;

    res.json({ success: true, message: `Role ${application.requestedRole} approved for user` });
  } catch (err) {
    console.error('Role approval failed:', (err as Error).message);
    res.status(500).json({ error: 'Approval failed' });
  }
};

export const rejectRoleApplication = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { applicationId, reason } = req.body;

    await updateApplicationStatus(applicationId, 'rejected');

    // Optionally log rejection reason in RoleApplication notes or another table
    if (reason) {
      await supabase
        .from('RoleApplication')
        .update({ notes: reason })
        .eq('id', applicationId);
    }

    res.json({ success: true, message: 'Application rejected' });
  } catch (err) {
    console.error('Role rejection failed:', (err as Error).message);
    res.status(500).json({ error: 'Rejection failed' });
  }
};
