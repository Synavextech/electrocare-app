import { supabase } from '../db';
import { z } from 'zod';
import { getNearbyShops } from './shop';

export interface DeviceSale {
    id: string;
    userId: string;
    shopId?: string;
    device: string;
    description: string;
    price: number;
    imageUrls: string[];
    condition: 'New' | 'Used' | 'Refurbished' | 'Unusable';
    status: 'pending' | 'approved' | 'rejected' | 'sold';
    category?: string;
    subCategory?: string;
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
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    price: z.number().positive("Price must be positive"),
    imageUrls: z.array(z.string()).max(5, "Up to 5 images allowed").optional(),
    condition: z.enum(['New', 'Used', 'Refurbished', 'Unusable']),
    location: z.string().optional().nullable(),
    category: z.string().optional(),
    subCategory: z.string().optional(),
});

export const createListing = async (data: any, userRole: string) => {
    console.log('Creating listing with data:', JSON.stringify(data, null, 2));

    // Validate permissions
    if ((data.condition === 'New' || data.condition === 'Refurbished') && userRole !== 'admin' && userRole !== 'shop') {
        throw new Error('Only Admin and Certified Shops can post New or Refurbished phones. Please contact a nearby shop for certification or to post on your behalf.');
    }

    // Ensure device is set
    const deviceName = data.title || data.device;
    if (!deviceName) {
        throw new Error('Device name (title) is required');
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
        const shops = await getNearbyShops(data.location);
        if (shops.length > 0) {
            shopName = shops[0].name.toUpperCase().replace(/\s+/g, '').slice(0, 5);
        }
    }

    const { count } = await supabase.from('DeviceSale').select('*', { count: 'exact', head: true });
    const sequence = String((count || 0) + 1).padStart(3, '0');

    const serialNumber = `${categoryCode}-${dateStr}-${shopName}-${sequence}`;

    const { data: listing, error } = await supabase
        .from('DeviceSale')
        .insert({
            userId: data.userId,
            device: deviceName,
            description: data.description,
            price: data.price,
            imageUrls: data.imageUrls || [],
            condition: data.condition,
            category: data.category,
            subCategory: data.subCategory,
            status: userRole === 'admin' || userRole === 'shop' ? 'approved' : 'pending',
            serialNumber
        })
        .select()
        .single();

    if (error) {
        console.error('Supabase error during listing creation:', error);
        throw error;
    }
    return listing;
};

export const getListings = async () => {
    const { data, error } = await supabase
        .from('DeviceSale')
        .select('*, user:User(*)')
        .eq('status', 'approved')
        .neq('condition', 'Unusable')
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
};
