import { supabase } from '../db';
export const getTechniciansByShop = async (shopId) => {
    let query = supabase.from('Technicians').select('*');
    if (shopId) {
        query = query.eq('shopId', shopId);
    }
    const { data, error } = await query;
    if (error) {
        console.error('getTechniciansByShop Error:', error);
        throw error;
    }
    return data;
};
export const getTechnicianById = async (id) => {
    const { data, error } = await supabase
        .from('Technicians')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        console.error('getTechnicianById Error:', error);
        return null;
    }
    return data;
};
export const createTechnician = async (data) => {
    const { data: newTech, error } = await supabase
        .from('Technicians')
        .insert([
        {
            ...data,
            rating: data.rating || 4.5,
            reviews: data.reviews || 0,
        }
    ])
        .select()
        .single();
    if (error) {
        console.error('createTechnician Error:', error);
        throw error;
    }
    return newTech;
};
//# sourceMappingURL=technician.js.map