import { Request, Response } from 'express';
import { supabase } from '../db.js';
import { createListing, getListings, destroyListing, markListingSold, subscribeStockNotification, updateStockQuantity, ListingSchema } from '../models/marketplace.js';

export const listListings = async (req: Request, res: Response) => {
    try {
        const listings = await getListings();
        res.json(listings);
    } catch (err) {
        console.error('Fetch failed:', (err as Error).message);
        res.status(500).json({ error: 'Fetch failed' });
    }
};

export const postListing = async (req: Request, res: Response) => {
    try {
        const data = ListingSchema.parse(req.body);
        const listing = await createListing({ ...data, userId: req.user!.id }, req.user!.role || 'user');
        res.json(listing);
    } catch (err) {
        console.error('Post failed:', (err as Error).message);
        res.status(500).json({ error: (err as Error).message });
    }
};

import { getUserById } from '../models/user.js';
import { createTransaction } from '../models/wallet.js';
import { initiateStkPush } from '../services/mpesa.js';

export const purchaseListing = async (req: Request, res: Response) => {
    try {
        const { saleId, paymentMethod = 'cod', phone, deliveryAddress, fulfillmentMethod = 'pickup' } = req.body;

        if (!saleId) {
            return res.status(400).json({ error: 'saleId is required' });
        }

        // Check stock availability
        const { data: listing, error: lErr } = await supabase
            .from('DeviceSale')
            .select('*')
            .eq('id', saleId)
            .single();

        if (lErr || !listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        if (listing.piecesAvailable !== undefined && listing.piecesAvailable <= 0) {
            return res.status(400).json({ error: 'This device is currently out of stock. Please use "Notify Me on Arrival".' });
        }

        const orderPrice = Number(req.body.price || listing.price);

        // 1. If paying with Wallet
        if (paymentMethod === 'wallet') {
            const buyer = await getUserById(req.user!.id);
            if (!buyer?.wallet) {
                return res.status(400).json({ error: 'Wallet not found' });
            }

            if (Number(buyer.wallet.balance) < orderPrice) {
                return res.status(400).json({
                    error: `Insufficient wallet balance (KES ${buyer.wallet.balance}). Total order: KES ${orderPrice}. Please top up or pay via M-Pesa.`
                });
            }

            // Deduct from buyer wallet
            const newBuyerBalance = Number(buyer.wallet.balance) - orderPrice;
            await supabase
                .from('Wallet')
                .update({ balance: newBuyerBalance })
                .eq('id', buyer.wallet.id);

            // Record buyer debit transaction
            await createTransaction({
                walletId: buyer.wallet.id,
                amount: orderPrice,
                type: 'payment',
            });

            // Create completed purchase with tracking metadata
            const trackingNumber = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const shippingStatus = fulfillmentMethod === 'delivery' ? 'in_transit' : 'delivered_to_shop';

            const { data: purchase, error: pErr } = await supabase
                .from('DevicePurchase')
                .insert({
                    saleId,
                    buyerId: req.user!.id,
                    status: 'completed',
                    price: orderPrice,
                    trackingNumber,
                    fulfillmentMethod,
                    deliveryAddress: deliveryAddress || null,
                    shippingStatus,
                })
                .select()
                .single();

            if (pErr) throw pErr;

            // Decrement stock
            const remainingStock = Math.max(0, (listing.piecesAvailable !== undefined ? Number(listing.piecesAvailable) : 1) - 1);
            await supabase
                .from('DeviceSale')
                .update({
                    piecesAvailable: remainingStock,
                    status: remainingStock <= 0 ? 'sold' : 'approved',
                    updatedAt: new Date().toISOString(),
                })
                .eq('id', listing.id);

            // Credit seller wallet if personal or shop listing
            if (listing.userId) {
                const seller = await getUserById(listing.userId);
                if (seller?.wallet) {
                    await supabase
                        .from('Wallet')
                        .update({ balance: Number(seller.wallet.balance || 0) + orderPrice })
                        .eq('id', seller.wallet.id);

                    await createTransaction({
                        walletId: seller.wallet.id,
                        amount: orderPrice,
                        type: 'deposit',
                    });
                }
            }

            // Record completed Payment entry
            await supabase.from('Payment').insert({
                userId: req.user!.id,
                amount: orderPrice,
                phone: phone || buyer.phone || '0000000000',
                type: 'purchase',
                reference: purchase.id,
                status: 'completed',
                metadata: {
                    method: 'wallet',
                    fulfillmentMethod,
                    deliveryAddress: deliveryAddress || null,
                    trackingNumber,
                },
            });

            // Emit live tracking event
            try {
                const { io } = await import('../app.js');
                io.emit('tracking_update', {
                    id: purchase.id,
                    tracking_number: trackingNumber,
                    status: shippingStatus,
                    device: listing.device,
                });
            } catch (sockErr) {
                console.warn('Socket broadcast warning:', sockErr);
            }

            return res.json({
                success: true,
                message: `Purchase completed successfully with your wallet balance! Tracking Number: ${trackingNumber}`,
                purchase: { ...purchase, trackingNumber, shippingStatus },
            });
        }

        // 2. If paying via M-Pesa STK Push
        if (paymentMethod === 'mpesa') {
            if (!phone) {
                return res.status(400).json({ error: 'M-Pesa phone number is required' });
            }

            const trackingNumber = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            // Create pending purchase
            const { data: purchase, error: pErr } = await supabase
                .from('DevicePurchase')
                .insert({
                    saleId,
                    buyerId: req.user!.id,
                    status: 'pending',
                    price: orderPrice,
                    trackingNumber,
                    fulfillmentMethod,
                    deliveryAddress: deliveryAddress || null,
                    shippingStatus: 'order_placed',
                })
                .select()
                .single();

            if (pErr) throw pErr;

            // Initiate Daraja STK Push
            const stkResult = await initiateStkPush({
                userId: req.user!.id,
                phone,
                amount: orderPrice,
                type: 'purchase',
                referenceId: purchase.id,
                accountReference: 'ElectroDevice',
                transactionDesc: `Order ${listing.device.slice(0, 20)}`,
            });

            return res.json({
                success: true,
                message: 'STK push initiated! Check your phone for the PIN prompt.',
                purchase: { ...purchase, trackingNumber, shippingStatus: 'order_placed' },
                stkResult,
            });
        }

        // 3. If paying with Cash on Delivery (COD) / Walk-in pickup
        const trackingNumber = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const shippingStatus = fulfillmentMethod === 'delivery' ? 'order_placed' : 'delivered_to_shop';

        const { data: purchase, error: pErr } = await supabase
            .from('DevicePurchase')
            .insert({
                saleId,
                buyerId: req.user!.id,
                status: 'pending',
                price: orderPrice,
                trackingNumber,
                fulfillmentMethod,
                deliveryAddress: deliveryAddress || null,
                shippingStatus,
            })
            .select()
            .single();

        if (pErr) throw pErr;

        return res.json({
            success: true,
            message: `Order placed for Pay on Pickup / Cash on Delivery! Tracking Number: ${trackingNumber}`,
            purchase: { ...purchase, trackingNumber, shippingStatus },
        });
    } catch (err) {
        console.error('Purchase failed:', (err as Error).message);
        res.status(500).json({ error: (err as Error).message || 'Purchase failed' });
    }
};

export const getMyPurchases = async (req: Request, res: Response) => {
    try {
        const { data: purchases, error } = await supabase
            .from('DevicePurchase')
            .select('*, sale:DeviceSale(*)')
            .eq('buyerId', req.user!.id)
            .order('createdAt', { ascending: false });

        if (error) throw error;
        res.json(purchases || []);
    } catch (err: any) {
        console.error('Fetch purchases error:', err.message);
        res.status(500).json({ error: 'Failed to fetch purchases' });
    }
};

export const updatePurchaseShippingStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { shippingStatus } = req.body; // 'order_placed' | 'processing' | 'in_transit' | 'delivered_to_shop' | 'delivered_to_customer'
        
        const { data: updated, error } = await supabase
            .from('DevicePurchase')
            .update({ 
                shippingStatus, 
                updatedAt: new Date().toISOString() 
            })
            .eq('id', id)
            .select('*, sale:DeviceSale(*)')
            .single();

        if (error) throw error;
        
        try {
            const { io } = await import('../app.js');
            io.emit('purchase_update', { purchaseId: id, shippingStatus });
            io.emit('tracking_update', { purchaseId: id, status: shippingStatus });
        } catch (sockErr) {
            console.warn('Socket notification error:', sockErr);
        }

        res.json({ success: true, purchase: updated });
    } catch (err: any) {
        console.error('Update purchase status error:', err.message);
        res.status(500).json({ error: 'Failed to update shipping status' });
    }
};


export const deleteListing = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await destroyListing(id, req.user!.id, req.user!.role || 'user');
        res.json(result);
    } catch (err) {
        console.error('Destroy listing failed:', (err as Error).message);
        res.status(500).json({ error: (err as Error).message || 'Failed to destroy listing' });
    }
};

export const markAsSold = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await markListingSold(id, req.user!.id, req.user!.role || 'user');
        res.json(result);
    } catch (err) {
        console.error('Mark as sold failed:', (err as Error).message);
        res.status(500).json({ error: (err as Error).message || 'Failed to mark as sold' });
    }
};

export const notifyArrival = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await subscribeStockNotification(id, req.user!.id, req.user!.email);
        res.json(result);
    } catch (err) {
        console.error('Subscribe arrival failed:', (err as Error).message);
        res.status(500).json({ error: (err as Error).message || 'Failed to subscribe for arrival notifications' });
    }
};

export const updateStock = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { piecesAvailable } = req.body;
        if (typeof piecesAvailable !== 'number' || piecesAvailable < 0) {
            return res.status(400).json({ error: 'Valid piecesAvailable count required' });
        }
        const result = await updateStockQuantity(id, piecesAvailable, req.user!.id, req.user!.role || 'user');
        res.json(result);
    } catch (err) {
        console.error('Update stock failed:', (err as Error).message);
        res.status(500).json({ error: (err as Error).message || 'Failed to update stock' });
    }
};


