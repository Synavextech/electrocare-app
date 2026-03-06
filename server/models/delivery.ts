import { supabase } from '../db';

export interface DeliveryPersonnel {
    id: string;
    name: string;
    type: 'RealTime' | 'OneTime';
    region: string;
    rating: number;
    current_load: number;
    shopId: string;
    email: string;
    createdAt: string;
}

export const getDeliveryPersonnelByShop = async (shopId?: string) => {
    let query = supabase.from('DeliveryPersonnel').select('*');
    if (shopId) {
        query = query.eq('shopId', shopId);
    }
    const { data, error } = await query;
    if (error) {
        console.error('getDeliveryPersonnelByShop Error:', error);
        throw error;
    }
    return data as DeliveryPersonnel[];
};

export const createDeliveryPersonnel = async (data: Partial<DeliveryPersonnel>) => {
    const { data: newDP, error } = await supabase
        .from('DeliveryPersonnel')
        .insert([
            {
                ...data,
                rating: data.rating || 4.5,
                current_load: data.current_load || 0,
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
