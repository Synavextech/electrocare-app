import { supabase } from '../db.js';
import { z } from 'zod';
import { getNearbyShops } from './shop.js';

export const ADMIN_ONLY_CATEGORIES = [
    'Security devices and accessories',
    'Gaming devices',
    'Internet connection devices & services',
    'Our flagship devices'
] as const;

export const STANDARD_CATEGORIES = [
    'Phones and accessories',
    'Computers/Laptops'
] as const;

export const ALL_MAIN_CATEGORIES = [
    'Phones and accessories',
    'Computers/Laptops',
    'Security devices and accessories',
    'Gaming devices',
    'Internet connection devices & services',
    'Our flagship devices',
    // Backwards-compatible legacy names
    'Mobile Phone',
    'Laptop'
] as const;

export const SUBCATEGORIES = [
    'Main Devices',
    'Device Accessories',
    // Backwards-compatible legacy names
    'Device',
    'Accessory'
] as const;

export interface DeviceSale {
    id: string;
    userId: string;
    shopId?: string;
    device: string;
    description: string;
    price: number;
    pointsAwarded?: number;
    cashAwarded?: number;
    piecesAvailable?: number;
    imageUrls: string[];
    condition: 'New' | 'Used' | 'Refurbished' | 'Unusable';
    status: 'pending' | 'approved' | 'rejected' | 'sold';
    mainCategory: string;
    subCategory: string;
    serialNumber: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DevicePurchase {
    id: string;
    saleId: string;
    buyerId: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    price: number;
    createdAt: Date;
    updatedAt: Date;
}

export const ListingSchema = z.object({
    device: z.string().min(1, "Device name is required"),
    description: z.string().min(1, "Description is required"),
    price: z.number().positive("Price must be positive"),
    piecesAvailable: z.number().int().min(0, "Pieces available must be 0 or more").optional().default(1),
    imageUrls: z.array(z.string()).max(5, "Up to 5 images allowed").optional(),
    condition: z.enum(['New', 'Used', 'Refurbished', 'Unusable']),
    location: z.string().optional().nullable(),
    mainCategory: z.enum(ALL_MAIN_CATEGORIES),
    subCategory: z.enum(SUBCATEGORIES),
    targetRecipient: z.enum(['admin', 'shop']).optional().nullable(),
    shopId: z.string().optional().nullable(),
});

export const createListing = async (data: any, userRole: string) => {
    console.log('Creating listing with data:', JSON.stringify(data, null, 2));

    // Validate permissions: Regular users can only post 'Used' or 'Unusable' (dead/unused for points/cash)
    if ((data.condition === 'New' || data.condition === 'Refurbished') && userRole !== 'admin' && userRole !== 'shop') {
        throw new Error('Only Admin and Certified Shops can post New or Refurbished items. Regular users can post Used items or trade in Dead/Unused devices.');
    }

    // Validate Admin-Only categories: Security devices, Gaming, Internet/Networking, Flagship devices
    const isAdminOnlyCategory = ADMIN_ONLY_CATEGORIES.some(cat => cat.toLowerCase() === data.mainCategory?.toLowerCase());
    if (isAdminOnlyCategory && userRole !== 'admin') {
        throw new Error(`The category "${data.mainCategory}" is reserved for ElectroCare Admin listings only.`);
    }

    // Normalize subCategory into standard DB strings ('Device' for Main Devices, 'Accessory' for Device Accessories)
    let normalizedSubCategory = data.subCategory;
    if (normalizedSubCategory === 'Main Devices' || normalizedSubCategory === 'Device') {
        normalizedSubCategory = 'Device';
    } else if (normalizedSubCategory === 'Device Accessories' || normalizedSubCategory === 'Accessory') {
        normalizedSubCategory = 'Accessory';
    }

    // Normalize mainCategory for legacy mappings
    let normalizedMainCategory = data.mainCategory;
    if (normalizedMainCategory === 'Mobile Phone') {
        normalizedMainCategory = 'Phones and accessories';
    } else if (normalizedMainCategory === 'Laptop') {
        normalizedMainCategory = 'Computers/Laptops';
    }

    // Dead / Unused device selling target validation
    let resolvedShopId: string | null = data.shopId || null;
    let targetNote = '';
    if (data.condition === 'Unusable') {
        if (data.targetRecipient === 'shop') {
            if (!data.shopId) {
                throw new Error('Please select a specific Certified Shop to sell your dead/unused device to.');
            }
            targetNote = `[Target Recipient: Shop (${data.shopId})] `;
        } else {
            resolvedShopId = null; // Directed to ElectroCare Central Admin
            targetNote = '[Target Recipient: ElectroCare Central Admin] ';
        }
    }

    // Ensure device is set
    const deviceName = data.device || data.title;
    if (!deviceName) {
        throw new Error('Device name is required');
    }

    // Generate Serialization: Category-DDMMYY-SHOPNAME-NNN
    const date = new Date();
    const yyyy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${dd}${mm}${yyyy}`;

    let categoryCode = 'U';
    if (data.condition === 'New') categoryCode = 'N';
    if (data.condition === 'Refurbished') categoryCode = 'R';

    // Find nearby shop name
    let shopName = 'ONLINE';
    if (data.location) {
        const shops = await getNearbyShops(data.location || '');
        if (shops && shops.length > 0) {
            shopName = shops[0].name.toUpperCase().replace(/\s+/g, '').slice(0, 5);
        }
    }

    const { count } = await supabase.from('DeviceSale').select('*', { count: 'exact', head: true });
    const sequence = String((count || 0) + 1).padStart(3, '0');

    const serialNumber = `${categoryCode}-${dateStr}-${shopName}-${sequence}`;

    // Auto-approval applies to admin and certified shops for normal inventory (New, Refurbished, Used).
    // Dead / Unusable trade-in phones always start as 'pending' to allow Admin/Shop inspection and points/cash reward.
    const initialStatus = (userRole === 'admin' || userRole === 'shop') && data.condition !== 'Unusable'
        ? 'approved'
        : 'pending';

    const insertPayload: any = {
        userId: data.userId,
        shopId: resolvedShopId,
        device: deviceName,
        description: targetNote ? `${targetNote}${data.description}` : data.description,
        price: data.price,
        piecesAvailable: data.piecesAvailable !== undefined ? Number(data.piecesAvailable) : 1,
        imageUrls: data.imageUrls || [],
        condition: data.condition,
        mainCategory: normalizedMainCategory,
        subCategory: normalizedSubCategory,
        status: initialStatus,
        serialNumber
    };

    const { data: listing, error } = await supabase
        .from('DeviceSale')
        .insert(insertPayload)
        .select()
        .single();

    if (error) {
        console.error('Supabase error during listing creation:', error);
        throw error;
    }
    return listing;
};

export const getListings = async (mainCategory?: string, subCategory?: string) => {
    let query = supabase
        .from('DeviceSale')
        .select('*, user:User(*)')
        .eq('status', 'approved')
        .neq('status', 'sold')
        .neq('condition', 'Unusable');

    if (mainCategory) {
        if (mainCategory === 'Phones and accessories' || mainCategory === 'Mobile Phone') {
            query = query.in('mainCategory', ['Phones and accessories', 'Mobile Phone']);
        } else if (mainCategory === 'Computers/Laptops' || mainCategory === 'Laptop') {
            query = query.in('mainCategory', ['Computers/Laptops', 'Laptop']);
        } else {
            query = query.eq('mainCategory', mainCategory);
        }
    }

    if (subCategory) {
        if (subCategory === 'Main Devices' || subCategory === 'Device') {
            query = query.in('subCategory', ['Main Devices', 'Device']);
        } else if (subCategory === 'Device Accessories' || subCategory === 'Accessory') {
            query = query.in('subCategory', ['Device Accessories', 'Accessory']);
        } else {
            query = query.eq('subCategory', subCategory);
        }
    }

    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
};

export const destroyListing = async (listingId: string, userId: string, userRole: string) => {
    // 1. Verify existence and permission
    const { data: listing, error: findError } = await supabase
        .from('DeviceSale')
        .select('*')
        .eq('id', listingId)
        .single();

    if (findError || !listing) {
        throw new Error('Listing not found');
    }

    if (userRole !== 'admin' && listing.userId !== userId) {
        throw new Error('Unauthorized to destroy this listing');
    }

    // 2. First attempt hard delete; fallback to marking status = 'sold' if foreign key exists
    const { error: deleteError } = await supabase
        .from('DeviceSale')
        .delete()
        .eq('id', listingId);

    if (deleteError) {
        console.warn('Hard delete cascade prevented, updating status to sold:', deleteError.message);
        const { error: updateError } = await supabase
            .from('DeviceSale')
            .update({ status: 'sold', updatedAt: new Date() })
            .eq('id', listingId);

        if (updateError) throw updateError;
        return { success: true, action: 'marked_sold' };
    }

    return { success: true, action: 'destroyed' };
};

export const markListingSold = async (listingId: string, userId: string, userRole: string) => {
    const { data: listing, error: findError } = await supabase
        .from('DeviceSale')
        .select('*')
        .eq('id', listingId)
        .single();

    if (findError || !listing) {
        throw new Error('Listing not found');
    }

    if (userRole !== 'admin' && listing.userId !== userId) {
        throw new Error('Unauthorized: only owner or admin can mark as sold');
    }

    const { data, error } = await supabase
        .from('DeviceSale')
        .update({ status: 'sold', piecesAvailable: 0, updatedAt: new Date() })
        .eq('id', listingId)
        .select()
        .single();

    if (error) throw error;
    return { success: true, data };
};

export const subscribeStockNotification = async (saleId: string, userId: string, userEmail?: string) => {
    const { data: sale, error: sErr } = await supabase.from('DeviceSale').select('*').eq('id', saleId).single();
    if (sErr || !sale) throw new Error('Listing not found');

    const { data: existing } = await supabase
        .from('StockNotification')
        .select('*')
        .eq('saleId', saleId)
        .eq('userId', userId)
        .maybeSingle();

    if (existing) {
        return { message: 'Already subscribed for arrival notifications on this item', data: existing };
    }

    const { data, error } = await supabase
        .from('StockNotification')
        .insert({
            saleId,
            userId,
            userEmail: userEmail || null,
            deviceTitle: sale.device,
            notified: false
        })
        .select()
        .single();

    if (error) throw error;
    return { message: 'Successfully subscribed to stock arrival notifications', data };
};

export const updateStockQuantity = async (saleId: string, piecesAvailable: number, userId: string, userRole: string) => {
    const { data: sale, error: sErr } = await supabase.from('DeviceSale').select('*').eq('id', saleId).single();
    if (sErr || !sale) throw new Error('Listing not found');

    if (userRole !== 'admin' && sale.userId !== userId) {
        throw new Error('Unauthorized to update stock for this listing');
    }

    const newStatus = piecesAvailable > 0 ? (sale.status === 'sold' ? 'approved' : sale.status) : sale.status;

    const { data, error } = await supabase
        .from('DeviceSale')
        .update({
            piecesAvailable,
            status: newStatus,
            updatedAt: new Date()
        })
        .eq('id', saleId)
        .select()
        .single();

    if (error) throw error;

    // If restocked (> 0), mark notifications
    if (piecesAvailable > 0) {
        await supabase
            .from('StockNotification')
            .update({ notified: true })
            .eq('saleId', saleId)
            .eq('notified', false);
    }

    return data;
};


