import { supabase } from '../db';
import { z } from 'zod';
export const SaleSchema = z.object({
    device: z.string(),
    price: z.number(),
    description: z.string().optional(),
    condition: z.string().optional(),
    imageUrl: z.string().optional(),
    serialNumber: z.string().optional(),
});
export const createSale = async (data) => {
    const { data: sale, error } = await supabase
        .from('DeviceSale')
        .insert({
        userId: data.userId,
        device: data.device,
        price: data.price,
        description: data.description,
        condition: data.condition,
        imageUrl: data.imageUrl,
        serialNumber: data.serialNumber,
    })
        .select()
        .single();
    if (error)
        throw error;
    return sale;
};
export const getSalesByUser = async (userId) => {
    const { data, error } = await supabase
        .from('DeviceSale')
        .select('*')
        .eq('userId', userId);
    if (error)
        throw error;
    return data;
};
export const updateSale = async (id, data) => {
    const { data: sale, error } = await supabase
        .from('DeviceSale')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return sale;
};
// On approval, award points to user via updateUser
//# sourceMappingURL=sale.js.map