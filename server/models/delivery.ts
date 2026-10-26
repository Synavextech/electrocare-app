import { supabase } from '../db.js';
import { calculateDistanceKm } from './shop.js';

export interface DeliveryPersonnel {
    id: string;
    name: string;
    type: 'RealTime' | 'OneTime';
    region: string;
    phone?: string | null;
    rating: number;
    current_load: number;
    shopId: string;
    email: string;
    status?: string;
    statusNote?: string | null;
    createdAt: string;
    lat?: number;
    lng?: number;
    distanceKm?: number;
    shop?: {
        id: string;
        name: string;
        address: string;
        lat: number;
        lng: number;
        county: string;
        status?: string;
    };
}

export interface DeliveryQueryOptions {
    shopId?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
}

export const getDeliveryPersonnel = async (options?: DeliveryQueryOptions) => {
    let query = supabase
        .from('DeliveryPersonnel')
        .select('*, shop:Shops(id, name, address, lat, lng, county, status)');

    if (options?.shopId) {
        query = query.eq('shopId', options.shopId);
    }
    const { data, error } = await query;
    if (error) {
        console.error('getDeliveryPersonnel Error:', error);
        throw error;
    }

    let personnel = (data || []) as DeliveryPersonnel[];

    const userLat = options?.lat;
    const userLng = options?.lng;

    if (typeof userLat === 'number' && typeof userLng === 'number' && !isNaN(userLat) && !isNaN(userLng)) {
        personnel = personnel.map((dp: any) => {
            const dpLat = typeof dp.lat === 'number' ? dp.lat : dp.shop?.lat;
            const dpLng = typeof dp.lng === 'number' ? dp.lng : dp.shop?.lng;
            const distance = (typeof dpLat === 'number' && typeof dpLng === 'number')
                ? calculateDistanceKm(userLat, userLng, dpLat, dpLng)
                : undefined;
            return {
                ...dp,
                distanceKm: distance
            };
        });

        if (typeof options?.radiusKm === 'number' && options.radiusKm > 0) {
            personnel = personnel.filter(p => typeof p.distanceKm === 'number' && p.distanceKm <= options.radiusKm!);
        }

        // Sort closest first
        personnel.sort((a, b) => {
            if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
            if (a.distanceKm === undefined) return 1;
            if (b.distanceKm === undefined) return -1;
            return a.distanceKm - b.distanceKm;
        });
    }

    return personnel;
};

export const getDeliveryPersonnelByShop = async (shopId?: string) => {
    return getDeliveryPersonnel({ shopId });
};

export const createDeliveryPersonnel = async (data: Partial<DeliveryPersonnel>) => {
    const { data: newDP, error } = await supabase
        .from('DeliveryPersonnel')
        .insert([
            {
                ...data,
                rating: data.rating || 4.5,
                current_load: data.current_load || 0,
                status: data.status || 'active',
                statusNote: data.statusNote || null,
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('createDeliveryPersonnel Error:', error);
        throw error;
    }
    return newDP as DeliveryPersonnel;
};

export const updateDeliveryPersonnelStatus = async (id: string, status: string, statusNote?: string | null) => {
    const { data, error } = await supabase
        .from('DeliveryPersonnel')
        .update({
            status,
            statusNote: statusNote !== undefined ? statusNote : null,
        })
        .eq('id', id)
        .select('*, shop:Shops(id, name, address, lat, lng, county, status)')
        .single();

    if (error) throw error;
    return data as DeliveryPersonnel;
};

export const updateDeliveryPersonnel = async (id: string, updates: Partial<DeliveryPersonnel>) => {
    const payload: any = { ...updates };
    delete payload.id;
    delete payload.createdAt;
    delete payload.shop;
    delete payload.distanceKm;

    const { data, error } = await supabase
        .from('DeliveryPersonnel')
        .update(payload)
        .eq('id', id)
        .select('*, shop:Shops(id, name, address, lat, lng, county, status)')
        .single();

    if (error) throw error;
    return data as DeliveryPersonnel;
};

