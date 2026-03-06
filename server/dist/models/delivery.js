import { supabase } from '../db';
export const getDeliveryPersonnelByShop = async (shopId) => {
    let query = supabase.from('DeliveryPersonnel').select('*');
    if (shopId) {
        query = query.eq('shopId', shopId);
    }
    const { data, error } = await query;
    if (error) {
        console.error('getDeliveryPersonnelByShop Error:', error);
        throw error;
    }
    return data;
};
export const createDeliveryPersonnel = async (data) => {
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
    return newDP;
};
//# sourceMappingURL=delivery.js.map