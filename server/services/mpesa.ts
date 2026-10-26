import axios from 'axios';
import { supabase } from '../db.js';

let cachedToken: { token: string; expiresAt: number } | null = null;

// Determine Daraja API base URL based on credentials (sandbox vs live production)
const DARAJA_BASE_URL = process.env.MPESA_ENV === 'sandbox'
  ? 'https://sandbox.safaricom.co.ke'
  : 'https://api.safaricom.co.ke';

/**
 * Normalizes phone numbers to Daraja format (2547XXXXXXXX or 2541XXXXXXXX)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  } else if (cleaned.startsWith('254')) {
    // Already in correct format
  } else if (phone.startsWith('+254')) {
    cleaned = phone.replace('+', '');
  }
  return cleaned;
}

/**
 * Acquires OAuth access token from Safaricom Daraja API
 */
export async function getDarajaToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token;
  }

  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa credentials not configured');
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await axios.get(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  const token = response.data.access_token;
  const expiresIn = Number(response.data.expires_in) || 3599;

  cachedToken = {
    token,
    expiresAt: now + (expiresIn * 1000),
  };

  return token;
}

export interface StkPushParams {
  userId?: string;
  phone: string;
  amount: number;
  type: 'listing_fee' | 'repair' | 'purchase' | 'wallet_topup';
  referenceId?: string; // saleId, repairId, etc.
  accountReference?: string;
  transactionDesc?: string;
}

/**
 * Initiates Lipa Na M-Pesa Online (STK Push)
 */
export async function initiateStkPush(params: StkPushParams) {
  const token = await getDarajaToken();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL || 'https://api.electrocare.tech/api/payments/callback';

  if (!shortcode || !passkey) {
    throw new Error('MPESA_SHORTCODE or MPESA_PASSKEY missing in configuration');
  }

  const formattedPhone = formatPhoneNumber(params.phone);
  if (!/^254[71]\d{8}$/.test(formattedPhone)) {
    throw new Error(`Invalid Kenyan phone number format: ${params.phone}. Please use 07XXXXXXXX or 01XXXXXXXX.`);
  }

  // Generate Daraja timestamp: YYYYMMDDHHmmss
  const date = new Date();
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const timestamp = `${yyyy}${MM}${dd}${HH}${mm}${ss}`;

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const amountToCharge = Math.max(1, Math.round(params.amount));

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amountToCharge,
    PartyA: formattedPhone,
    PartyB: shortcode,
    PhoneNumber: formattedPhone,
    CallBackURL: callbackUrl,
    AccountReference: (params.accountReference || 'ElectroCare').slice(0, 12),
    TransactionDesc: (params.transactionDesc || 'Service Payment').slice(0, 13),
  };

  const response = await axios.post(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const { MerchantRequestID, CheckoutRequestID, ResponseCode, CustomerMessage } = response.data;

  // Record initial payment entry in Supabase
  await supabase.from('Payment').insert({
    userId: params.userId || null,
    amount: amountToCharge,
    phone: formattedPhone,
    type: params.type,
    reference: params.referenceId || null,
    merchantRequestId: MerchantRequestID,
    checkoutRequestId: CheckoutRequestID,
    status: 'pending',
    metadata: {
      accountReference: params.accountReference,
      transactionDesc: params.transactionDesc,
      rawResponse: response.data,
    },
  });

  return {
    merchantRequestId: MerchantRequestID,
    checkoutRequestId: CheckoutRequestID,
    responseCode: ResponseCode,
    customerMessage: CustomerMessage,
  };
}

/**
 * Checks STK push status via Safaricom Daraja Query API
 */
export async function queryStkPushStatus(checkoutRequestId: string) {
  // First check database for completed status
  const { data: existingPayment } = await supabase
    .from('Payment')
    .select('*')
    .eq('checkoutRequestId', checkoutRequestId)
    .single();

  if (existingPayment && existingPayment.status === 'completed') {
    return { status: 'completed', payment: existingPayment };
  }

  const token = await getDarajaToken();
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;

  const date = new Date();
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const timestamp = `${yyyy}${MM}${dd}${HH}${mm}${ss}`;

  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  try {
    const response = await axios.post(`${DARAJA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const resultCode = response.data.ResultCode;
    if (resultCode === '0' || resultCode === 0) {
      if (existingPayment && existingPayment.status !== 'completed') {
        await fulfillSuccessfulPayment(existingPayment, 'STK-QUERY');
      }
      return { status: 'completed', response: response.data };
    } else {
      await supabase
        .from('Payment')
        .update({ status: 'failed', metadata: response.data })
        .eq('checkoutRequestId', checkoutRequestId);
      return { status: 'failed', response: response.data };
    }
  } catch (err: any) {
    // If Daraja query indicates request in process
    return {
      status: existingPayment?.status || 'pending',
      message: err.response?.data?.errorMessage || err.message,
    };
  }
}

/**
 * Fulfills corresponding business action upon confirmed payment
 */
export async function fulfillSuccessfulPayment(payment: any, receiptNumber?: string) {
  await supabase
    .from('Payment')
    .update({
      status: 'completed',
      mpesaReceiptNumber: receiptNumber || null,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', payment.id);

  // Side-effect based on payment type:
  if (payment.type === 'listing_fee' && payment.reference) {
    // 1. Mark marketplace device listing as paid and ready for review
    await supabase
      .from('DeviceSale')
      .update({
        listingFeePaid: true,
        paymentStatus: 'paid',
        status: 'pending' // Enters review pipeline
      })
      .eq('id', payment.reference);
  } else if (payment.type === 'wallet_topup' && payment.userId) {
    // 2. Top-up user's wallet
    const { data: user } = await supabase
      .from('User')
      .select('*, wallet:Wallet(*)')
      .eq('id', payment.userId)
      .single();

    const wallet = Array.isArray(user?.wallet) ? user.wallet[0] : user?.wallet;
    if (wallet) {
      const newBal = Number(wallet.balance) + Number(payment.amount);
      await supabase
        .from('Wallet')
        .update({ balance: newBal })
        .eq('id', wallet.id);

      await supabase.from('Transaction').insert({
        walletId: wallet.id,
        amount: Number(payment.amount),
        type: 'deposit'
      });

      try {
        const { io } = await import('../app.js');
        io.emit('wallet_update', { userId: payment.userId, balance: newBal });
      } catch (err) {
        console.warn('Socket notification error on topup:', err);
      }
    }
  } else if (payment.type === 'repair' && payment.reference) {
    // 3. Update repair request payment status
    await supabase
      .from('RepairRequest')
      .update({ payment_status: 'paid' })
      .eq('id', payment.reference);
  } else if (payment.type === 'purchase' && payment.reference) {
    // 4. Update device purchase order, set shipping status, and decrement stock
    const { data: purchase } = await supabase
      .from('DevicePurchase')
      .update({ 
        status: 'completed',
        shippingStatus: 'processing',
        updatedAt: new Date().toISOString()
      })
      .eq('id', payment.reference)
      .select('*, sale:DeviceSale(*)')
      .single();

    if (purchase?.sale) {
      const remainingStock = Math.max(0, (purchase.sale.piecesAvailable !== undefined ? Number(purchase.sale.piecesAvailable) : 1) - 1);
      await supabase
        .from('DeviceSale')
        .update({
          piecesAvailable: remainingStock,
          status: remainingStock <= 0 ? 'sold' : 'approved',
          updatedAt: new Date().toISOString()
        })
        .eq('id', purchase.sale.id);

      // Credit seller wallet if personal or shop listing
      if (purchase.sale.userId) {
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

      try {
        const { io } = await import('../app.js');
        io.emit('purchase_update', { purchaseId: purchase.id, status: 'completed', shippingStatus: 'processing' });
        io.emit('tracking_update', { purchaseId: purchase.id, status: 'processing', device: purchase.sale?.device });
      } catch (err) {
        console.warn('Socket emit on purchase fulfillment warning:', err);
      }
    }
  }
}
