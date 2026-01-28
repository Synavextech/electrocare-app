"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getListings = exports.createListing = exports.ListingSchema = void 0;
const db_1 = require("../db");
const zod_1 = require("zod");
const shop_1 = require("./shop");
exports.ListingSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required"),
    description: zod_1.z.string().min(1, "Description is required"),
    price: zod_1.z.number().positive("Price must be positive"),
    imageUrls: zod_1.z.array(zod_1.z.string()).max(5, "Up to 5 images allowed").optional(),
    condition: zod_1.z.enum(['New', 'Used', 'Refurbished', 'Unusable']),
    location: zod_1.z.string().optional().nullable(),
    category: zod_1.z.string().optional(),
    subCategory: zod_1.z.string().optional(),
});
const createListing = async (data, userRole) => {
    console.log('Creating listing with data:', JSON.stringify(data, null, 2));
    // Validate permissions
    if ((data.condition === 'New' || data.condition === 'Refurbished') && userRole !== 'admin' && userRole !== 'shop') {
        throw new Error('Only Admin and Shops can post New or Refurbished items.');
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
    if (data.condition === 'New')
        categoryCode = 'N';
    if (data.condition === 'Refurbished')
        categoryCode = 'R';
    // Find nearby shop name
    let shopName = 'ONLINE';
    if (data.location) {
        const shops = await (0, shop_1.getNearbyShops)(data.location);
        if (shops.length > 0) {
            shopName = shops[0].name.toUpperCase().replace(/\s+/g, '').slice(0, 5);
        }
    }
    const { count } = await db_1.supabase.from('DeviceSale').select('*', { count: 'exact', head: true });
    const sequence = String((count || 0) + 1).padStart(3, '0');
    const serialNumber = `${categoryCode}-${dateStr}-${shopName}-${sequence}`;
    const { data: listing, error } = await db_1.supabase
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
exports.createListing = createListing;
const getListings = async () => {
    const { data, error } = await db_1.supabase
        .from('DeviceSale')
        .select('*, user:User(*)')
        .eq('status', 'approved')
        .neq('condition', 'Unusable')
        .order('createdAt', { ascending: false });
    if (error)
        throw error;
    return data;
};
exports.getListings = getListings;
//# sourceMappingURL=marketplace.js.map