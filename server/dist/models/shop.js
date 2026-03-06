import { supabase } from '../db';
import { z } from 'zod';
export const ShopSchema = z.object({
    name: z.string(),
    address: z.string(),
    lat: z.number(),
    lng: z.number(),
    county: z.string(),
    services: z.array(z.string()).optional(),
});
export const createShop = async (data) => {
    // Generate Shop Code: DDMMYY-COUNTY-NNN
    const date = new Date();
    const yyyy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${dd}${mm}${yyyy}`;
    const county = data.county.toUpperCase().replace(/\s+/g, '');
    // Find count of shops in this county using Supabase
    const { count } = await supabase
        .from('Shops')
        .select('*', { count: 'exact', head: true })
        .ilike('county', county);
    const sequence = String((count || 0) + 1).padStart(3, '0');
    const shopCode = `${dateStr}-${county}-${sequence}`;
    const { data: newShop, error } = await supabase
        .from('Shops')
        .insert({
        shopCode,
        name: data.name,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        county: data.county,
        services: data.services || [],
        rating: 4.5,
    })
        .select()
        .single();
    if (error)
        throw error;
    return newShop;
};
export const getShops = async () => {
    const { data, error } = await supabase
        .from('Shops')
        .select('*')
        .order('name', { ascending: true });
    if (error)
        throw error;
    return data;
};
export const getNearbyShops = async (location) => {
    if (!location) {
        return getShops();
    }
    // Simplified: filtering by county or address match for now if location is a string
    const { data, error } = await supabase
        .from('Shops')
        .select('*')
        .or(`county.ilike.%${location}%,address.ilike.%${location}%`)
        .order('rating', { ascending: false });
    if (error)
        throw error;
    return data;
};
export const getShopByCode = async (shopCode) => {
    const { data, error } = await supabase
        .from('Shops')
        .select('*')
        .eq('shopCode', shopCode)
        .single();
    if (error) {
        console.error('getShopByCode Error:', error);
        return null;
    }
    return data;
};
export const updateShopServices = async (shopCode, services) => {
    const { data, error } = await supabase
        .from('Shops')
        .update({ services, updatedAt: new Date() })
        .eq('shopCode', shopCode)
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
//# sourceMappingURL=shop.js.map