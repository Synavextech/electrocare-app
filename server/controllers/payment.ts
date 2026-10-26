import { Request, Response } from 'express';
import { initiateStkPush, queryStkPushStatus, fulfillSuccessfulPayment } from '../services/mpesa.js';
import { supabase } from '../db.js';
import { getUserById } from '../models/user.js';
import { createTransaction } from '../models/wallet.js';

export const initiatePayment = async (req: Request, res: Response) => {
  try {
    const { phone, amount, type, referenceId, accountReference, transactionDesc } = req.body;

    if (!phone || !amount || !type) {
      return res.status(400).json({ error: 'phone, amount, and payment type are required' });
    }

    const userId = req.user?.id;

    const result = await initiateStkPush({
      userId,
      phone,
      amount: Number(amount),
      type,
      referenceId,
      accountReference: accountReference || 'ElectroCare',
      transactionDesc: transactionDesc || `${type} payment`,
    });

    res.json({
      success: true,
      message: 'STK push initiated. Please check your phone for PIN prompt.',
      data: result,
    });
  } catch (err: any) {
    console.error('STK Push Error:', err.response?.data || err.message);
    res.status(500).json({
      error: err.response?.data?.errorMessage || err.message || 'Payment initiation failed',
    });
  }
};

export const checkPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { checkoutRequestId } = req.params;
    if (!checkoutRequestId) {
      return res.status(400).json({ error: 'checkoutRequestId is required' });
    }

    const result = await queryStkPushStatus(checkoutRequestId);
    res.json(result);
  } catch (err: any) {
    console.error('Status check error:', err.message);
    res.status(500).json({ error: 'Status check failed' });
  }
};

export const handleMpesaCallback = async (req: Request, res: Response) => {
  try {
    const callbackData = req.body?.Body?.stkCallback;
    console.log('Received M-Pesa Callback:', JSON.stringify(callbackData, null, 2));

    if (!callbackData) {
      return res.json({ ResultCode: 0, ResultDesc: 'No data' });
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

    const { data: payment } = await supabase
      .from('Payment')
      .select('*')
      .eq('checkoutRequestId', CheckoutRequestID)
      .single();

    if (ResultCode === 0) {
      // Payment successful
      let receiptNumber = '';
      if (CallbackMetadata?.Item) {
        const receiptItem = CallbackMetadata.Item.find((item: any) => item.Name === 'MpesaReceiptNumber');
        receiptNumber = receiptItem?.Value || '';
      }

      if (payment) {
        await fulfillSuccessfulPayment(payment, receiptNumber);
      }
    } else {
      // Payment cancelled or failed
      if (payment) {
        await supabase
          .from('Payment')
          .update({
            status: 'failed',
            metadata: { ResultCode, ResultDesc },
            updatedAt: new Date().toISOString(),
          })
          .eq('id', payment.id);
      }
    }

    // Always respond 200 with Safaricom expected payload
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (err: any) {
    console.error('Callback handler error:', err.message);
    res.json({ ResultCode: 0, ResultDesc: 'Accepted with internal note' });
  }
};

/**
 * Pay KES 20 marketplace listing fee directly using existing wallet balance
 */
export const payListingFeeWithWallet = async (req: Request, res: Response) => {
  try {
    const { saleId } = req.body;
    if (!saleId) {
      return res.status(400).json({ error: 'saleId is required' });
    }

    const user = await getUserById(req.user!.id);
    if (!user?.wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const LISTING_FEE = 20; // KES 20
    if (Number(user.wallet.balance) < LISTING_FEE) {
      return res.status(400).json({
        error: `Insufficient wallet balance (${user.wallet.balance} KES). Required: ${LISTING_FEE} KES. Please top up or pay via M-Pesa.`,
      });
    }

    // Deduct from wallet
    const newBalance = Number(user.wallet.balance) - LISTING_FEE;
    const { error: wErr } = await supabase
      .from('Wallet')
      .update({ balance: newBalance })
      .eq('id', user.wallet.id);

    if (wErr) throw wErr;

    // Record transaction
    await createTransaction({
      walletId: user.wallet.id,
      amount: LISTING_FEE,
      type: 'payment',
    });

    // Activate listing
    const { data: updatedSale, error: sErr } = await supabase
      .from('DeviceSale')
      .update({
        listingFeePaid: true,
        paymentStatus: 'paid',
        status: 'pending', // Enters admin/shop review queue
      })
      .eq('id', saleId)
      .eq('userId', user.id)
      .select()
      .single();

    if (sErr) throw sErr;

    // Record completed Payment entry
    await supabase.from('Payment').insert({
      userId: user.id,
      amount: LISTING_FEE,
      phone: user.phone || '0000000000',
      type: 'listing_fee',
      reference: saleId,
      status: 'completed',
      metadata: { method: 'wallet', balanceRemaining: newBalance },
    });

    res.json({
      success: true,
      message: 'Listing fee paid successfully from wallet. Your listing is now pending review.',
      listing: updatedSale,
    });
  } catch (err: any) {
    console.error('Wallet listing fee error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to pay listing fee' });
  }
};
