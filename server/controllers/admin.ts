
import { Request, Response } from 'express';
import { supabase } from '../db.js';
import axios from 'axios';
import { updateApplicationStatus } from '../models/roleApplication.js';

// Admin approves sales, awards points or cash
export const approveSale = async (req: Request, res: Response) => {
  try {
    if (!['admin', 'shop', 'technician'].includes(req.user?.role || '')) return res.status(403).json({ error: 'Forbidden' });
    const { saleId, points, cash } = req.body;

    // Determine what to award
    const updateData: any = { status: 'approved' };
    if (points) updateData.pointsAwarded = points;
    if (cash) updateData.cashAwarded = cash;

    const { data: sale, error } = await supabase
      .from('DeviceSale')
      .update(updateData)
      .eq('id', saleId)
      .select('*, user:User(*, wallet:Wallet(*))')
      .single();

    if (error) {
      console.error('Supabase error during approval:', JSON.stringify(error, null, 2));
      throw error;
    }

    const userWallet = Array.isArray(sale.user?.wallet) ? sale.user.wallet[0] : sale.user?.wallet;
    if (userWallet) {
      const walletUpdate: any = {};
      if (points) walletUpdate.points = (userWallet.points || 0) + (points || 0);
      if (cash) walletUpdate.balance = (userWallet.balance || 0) + (cash || 0);

      const { error: walletError } = await supabase
        .from('Wallet')
        .update(walletUpdate)
        .eq('id', userWallet.id);

      if (walletError) {
        console.error('Wallet update failed:', walletError);
      }

      if (cash && Number(cash) > 0) {
        await supabase.from('Transaction').insert({
          walletId: userWallet.id,
          amount: Number(cash),
          type: 'deposit'
        });
      }
    }
    res.json(sale);
  } catch (err) {
    console.error('Approval failed details:', err);
    res.status(500).json({ error: (err as Error).message || 'Approval failed' });
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

    const userWallet = Array.isArray(user?.wallet) ? user.wallet[0] : user?.wallet;

    if (!userWallet || userWallet.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

    const { getDarajaToken } = await import('../services/mpesa.js');
    const accessToken = await getDarajaToken();
    const darajaUrl = process.env.MPESA_ENV === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke'
      : 'https://api.safaricom.co.ke';

    const b2cResponse = await axios.post(`${darajaUrl}/mpesa/b2c/v1/paymentrequest`, {
      InitiatorName: process.env.MPESA_INITIATOR_NAME || 'testapi',
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL || '', // Generate via cert
      CommandID: 'BusinessPayment',
      Amount: amount,
      PartyA: process.env.MPESA_SHORTCODE,
      PartyB: phone,
      Remarks: 'Withdrawal',
      QueueTimeOutURL: process.env.MPESA_CALLBACK_URL || 'https://api.electrocare.tech/api/payments/callback',
      ResultURL: process.env.MPESA_CALLBACK_URL || 'https://api.electrocare.tech/api/payments/callback',
      Occasion: 'ElectroCare Withdrawal',
    }, { headers: { Authorization: `Bearer ${accessToken}` } });

    await supabase.from('Transaction').insert({ walletId: userWallet.id, type: 'withdrawal', amount });
    await supabase.from('Wallet').update({ balance: userWallet.balance - amount }).eq('id', userWallet.id);

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
    const formatted = data?.map(u => ({
      ...u,
      wallet: Array.isArray(u.wallet) ? u.wallet[0] || null : u.wallet
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
};

export const getPendingSales = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    if (!['admin', 'shop', 'technician'].includes(userRole || '')) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let query = supabase
      .from('DeviceSale')
      .select('*, user:User(*)')
      .eq('status', 'pending');

    if (userRole === 'shop') {
      const { data: myShop } = await supabase
        .from('Shops')
        .select('id')
        .or(`userId.eq.${req.user?.id},name.ilike.%${req.user?.name || 'nomatch'}%`)
        .maybeSingle();

      if (myShop) {
        query = query.or(`shopId.eq.${myShop.id},and(condition.eq.Unusable,shopId.is.null)`);
      }
    } else if (userRole === 'technician') {
      const { data: tech } = await supabase
        .from('Technicians')
        .select('shopId')
        .eq('userId', req.user?.id)
        .maybeSingle();

      if (tech?.shopId) {
        query = query.eq('shopId', tech.shopId);
      }
    }

    const { data, error } = await query.order('createdAt', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Fetch pending sales error:', err);
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
      .eq('type', 'withdrawal')
      .order('createdAt', { ascending: false });
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

    // 2. Decrement stock
    const currentStock = purchase.sale?.piecesAvailable !== undefined ? Number(purchase.sale.piecesAvailable) : 1;
    const remainingStock = Math.max(0, currentStock - 1);
    const updatedStatus = remainingStock <= 0 ? 'sold' : 'approved';

    await supabase.from('DevicePurchase').update({ status: 'approved' }).eq('id', purchaseId);
    await supabase.from('DeviceSale').update({
      piecesAvailable: remainingStock,
      status: updatedStatus,
      updatedAt: new Date()
    }).eq('id', purchase.saleId);

    // 3. Logic for fund transfer: credit seller's wallet
    if (purchase.sale?.userId) {
      const { data: sellerUser } = await supabase
        .from('User')
        .select('*, wallet:Wallet(*)')
        .eq('id', purchase.sale.userId)
        .single();

      const sellerWallet = Array.isArray(sellerUser?.wallet) ? sellerUser.wallet[0] : sellerUser?.wallet;
      if (sellerWallet) {
        const saleAmount = Number(purchase.price || purchase.sale.price || 0);
        await supabase
          .from('Wallet')
          .update({ balance: Number(sellerWallet.balance || 0) + saleAmount })
          .eq('id', sellerWallet.id);

        await supabase.from('Transaction').insert({
          walletId: sellerWallet.id,
          amount: saleAmount,
          type: 'deposit'
        });
      }
    }

    res.json({ success: true, remainingStock });
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

    // 3. Automatically provision profile in Technicians or DeliveryPersonnel
    const { data: applicant } = await supabase
      .from('User')
      .select('name, email, phone')
      .eq('id', application.userId)
      .single();

    if (application.requestedRole === 'technician') {
      const proficiencyStr = Array.isArray(application.proficiency) && application.proficiency.length > 0
        ? application.proficiency.map((p: string) => p.replace('_', ' ')).join(', ')
        : 'Hardware Diagnostic';
      const devicesStr = Array.isArray(application.preferredDevices) && application.preferredDevices.length > 0
        ? application.preferredDevices.join(', ')
        : 'All Models';
      const levelStr = application.experienceLevel ? application.experienceLevel.replace(/_/g, ' ') : 'Fully Experienced';

      await supabase.from('Technicians').upsert({
        name: applicant?.name || 'Technician',
        email: applicant?.email,
        phone: application.phone || applicant?.phone,
        shopId: application.shopId || null,
        userId: application.userId,
        category: proficiencyStr,
        subCategory: levelStr,
        description: `Experienced in: ${devicesStr}. Proficiency: ${proficiencyStr}. Level: ${levelStr}.`,
        status: 'active',
        statusNote: 'Approved certified specialist',
        rating: 4.8
      }, { onConflict: 'email' });
    } else if (application.requestedRole === 'delivery') {
      const typeMode = application.deliveryFrequency === 'one_time_24hr' ? 'OneTime' : 'RealTime';
      const vehicle = application.vehicleType || 'Motorbike';

      await supabase.from('DeliveryPersonnel').upsert({
        name: applicant?.name || 'Delivery Rider',
        email: applicant?.email,
        phone: application.phone || applicant?.phone,
        shopId: application.shopId || null,
        userId: application.userId,
        type: typeMode,
        region: application.locality || 'All Localities',
        status: 'active',
        statusNote: `Vehicle: ${vehicle}. Frequency: ${application.deliveryFrequency === 'one_time_24hr' ? '24hr One-Time' : 'On-Call'}.`,
        rating: 4.8
      }, { onConflict: 'email' });
    }

    res.json({ success: true, message: `Role ${application.requestedRole} approved and provisioned for user` });
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

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ['user', 'admin', 'technician', 'shop', 'delivery'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    const { data: updatedUser, error: uError } = await supabase
      .from('User')
      .update({ role, updatedAt: new Date() })
      .eq('id', id)
      .select('*, wallet:Wallet(*)')
      .single();

    if (uError) throw uError;

    // Sync role with Supabase Auth metadata
    try {
      await supabase.auth.admin.updateUserById(id, {
        user_metadata: { role }
      });
    } catch (authErr) {
      console.warn('Could not update auth user_metadata:', (authErr as Error).message);
    }

    res.json({ success: true, message: `User role updated to ${role}`, user: updatedUser });
  } catch (err) {
    console.error('Update user role failed:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message || 'Failed to update user role' });
  }
};

export const getTechnicianReports = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { getTechnicianReportsList } = await import('../models/technician.js');
    const reports = await getTechnicianReportsList();
    res.json(reports);
  } catch (err) {
    console.error('Fetch technician reports failed:', (err as Error).message);
    res.status(500).json({ error: 'Failed to fetch technician reports' });
  }
};

export const updateTechnicianReport = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;
    const { updateTechnicianReportStatus } = await import('../models/technician.js');
    const updated = await updateTechnicianReportStatus(id, status, resolutionNotes);
    res.json(updated);
  } catch (err) {
    console.error('Update technician report failed:', (err as Error).message);
    res.status(500).json({ error: 'Failed to update technician report' });
  }
};
