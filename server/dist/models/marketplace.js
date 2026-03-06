import { supabase } from '../db';
import { z } from 'zod';
import { getNearbyShops } from './shop';
export const ListingSchema = z.object({
    device: z.string().min(1, "Device name is required"),
    description: z.string().min(1, "Description is required"),
    price: z.number().positive("Price must be positive"),
    imageUrls: z.array(z.string()).max(5, "Up to 5 images allowed").optional(),
    condition: z.enum(['New', 'Used', 'Refurbished', 'Unusable']),
    location: z.string().optional().nullable(),
    mainCategory: z.enum(['Mobile Phone', 'Laptop']),
    subCategory: z.enum(['Device', 'Accessory']),
});
export const createListing = async (data, userRole) => {
    console.log('Creating listing with data:', JSON.stringify(data, null, 2));
    // Validate permissions
    if ((data.condition === 'New' || data.condition === 'Refurbished') && userRole !== 'admin' && userRole !== 'shop') {
        throw new Error('Only Admin and Certified Shops can post New or Refurbished items. Please contact a nearby shop for certification or to post on your behalf.');
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
    if (data.condition === 'New')
        categoryCode = 'N';
    if (data.condition === 'Refurbished')
        categoryCode = 'R';
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
    const { data: listing, error } = await supabase
        .from('DeviceSale')
        .insert({
        userId: data.userId,
        device: deviceName,
        description: data.description,
        price: data.price,
        imageUrls: data.imageUrls || [],
        condition: data.condition,
        mainCategory: data.mainCategory,
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
export const getListings = async (mainCategory, subCategory) => {
    let query = supabase
        .from('DeviceSale')
        .select('*, user:User(*)')
        .eq('status', 'approved')
        .neq('condition', 'Unusable');
    if (mainCategory)
        query = query.eq('mainCategory', mainCategory);
    if (subCategory)
        query = query.eq('subCategory', subCategory);
    const { data, error } = await query.order('createdAt', { ascending: false });
    if (error)
        throw error;
    return data;
};
//# sourceMappingURL=marketplace.js.map