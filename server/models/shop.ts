import { supabase } from '../db.js';
import { z } from 'zod';

export interface Shop {
  id: string;
  shopCode: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  county: string;
  rating?: number;
  services?: string[];
  distanceKm?: number;
  status?: string; // 'active' | 'closed' | 'suspended' | 'coming_soon' | string
  statusNote?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const ShopSchema = z.object({
  name: z.string(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  county: z.string(),
  services: z.array(z.string()).optional(),
  status: z.string().optional(),
  statusNote: z.string().nullable().optional(),
});

export const createShop = async (data: Partial<Shop>) => {
  // Generate Shop Code: DDMMYY-COUNTY-NNN
  const date = new Date();
  const yyyy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${dd}${mm}${yyyy}`;
  const county = data.county!.toUpperCase().replace(/\s+/g, '');

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
      name: data.name!,
      address: data.address!,
      lat: data.lat!,
      lng: data.lng!,
      county: data.county!,
      services: data.services || [],
      rating: 4.5,
      status: data.status || 'active',
      statusNote: data.statusNote || null,
    })
    .select()
    .single();

  if (error) throw error;
  return newShop;
};

export const getShops = async () => {
  const { data, error } = await supabase
    .from('Shops')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Shop[];
};

export interface NearbyQueryOptions {
  location?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export const getNearbyShops = async (query?: string | NearbyQueryOptions) => {
  let location: string | undefined;
  let lat: number | undefined;
  let lng: number | undefined;
  let radiusKm: number | undefined;

  if (typeof query === 'string') {
    location = query;
  } else if (query) {
    location = query.location;
    lat = query.lat;
    lng = query.lng;
    radiusKm = query.radiusKm;
  }

  // If coordinates provided, calculate Haversine distance from user location
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    const { data, error } = await supabase
      .from('Shops')
      .select('*');

    if (error) throw error;
    if (!data) return [];

    let shopsWithDistance: Shop[] = data.map((shop: any) => {
      const distance = (typeof shop.lat === 'number' && typeof shop.lng === 'number')
        ? calculateDistanceKm(lat!, lng!, shop.lat, shop.lng)
        : undefined;
      return {
        ...shop,
        distanceKm: distance
      };
    });

    // Filter by radius if provided
    if (typeof radiusKm === 'number' && radiusKm > 0) {
      shopsWithDistance = shopsWithDistance.filter(s => typeof s.distanceKm === 'number' && s.distanceKm <= radiusKm!);
    }

    // Sort closest first
    shopsWithDistance.sort((a, b) => {
      if (a.distanceKm === undefined) return 1;
      if (b.distanceKm === undefined) return -1;
      return a.distanceKm - b.distanceKm;
    });

    return shopsWithDistance;
  }

  // Fallback to text matching if location string provided
  if (location && location.trim().length > 0) {
    const { data, error } = await supabase
      .from('Shops')
      .select('*')
      .or(`county.ilike.%${location}%,address.ilike.%${location}%,name.ilike.%${location}%`)
      .order('rating', { ascending: false });

    if (error) throw error;
    return data as Shop[];
  }

  return getShops();
};

export const getShopByCode = async (shopCode: string) => {
  const { data, error } = await supabase
    .from('Shops')
    .select('*')
    .eq('shopCode', shopCode)
    .single();

  if (error) {
    console.error('getShopByCode Error:', error);
    return null;
  }
  return data as Shop;
};

export const updateShopServices = async (shopCode: string, services: string[]) => {
  const { data, error } = await supabase
    .from('Shops')
    .update({ services, updatedAt: new Date() })
    .eq('shopCode', shopCode)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateShopStatus = async (idOrCode: string, status: string, statusNote?: string | null) => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
  const query = supabase
    .from('Shops')
    .update({
      status,
      statusNote: statusNote !== undefined ? statusNote : null,
      updatedAt: new Date()
    });

  const { data, error } = isUuid
    ? await query.eq('id', idOrCode).select().single()
    : await query.eq('shopCode', idOrCode).select().single();

  if (error) throw error;
  return data as Shop;
};

export const updateShopConfig = async (idOrCode: string, updates: Partial<Shop>) => {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
  const payload: any = { ...updates, updatedAt: new Date() };
  delete payload.id;
  delete payload.shopCode;
  delete payload.createdAt;
  delete payload.distanceKm;

  const query = supabase.from('Shops').update(payload);
  const { data, error } = isUuid
    ? await query.eq('id', idOrCode).select().single()
    : await query.eq('shopCode', idOrCode).select().single();

  if (error) throw error;
  return data as Shop;
};
