import { supabase } from '../db';

export interface Technician {
  id: string;
  name: string;
  description: string;
  phone: string;
  email: string;
  rating: number;
  reviews: number;
  category: string;
  subCategory: string;
  shopId: string;
  createdAt: string;
}

export const getTechniciansByShop = async (shopId?: string) => {
  let query = supabase.from('Technicians').select('*');
  if (shopId) {
    query = query.eq('shopId', shopId);
  }
  const { data, error } = await query;
  if (error) {
    console.error('getTechniciansByShop Error:', error);
    throw error;
  }
  return data as Technician[];
};

export const getTechnicianById = async (id: string) => {
  const { data, error } = await supabase
    .from('Technicians')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error('getTechnicianById Error:', error);
    return null;
  }
  return data as Technician;
};

export const createTechnician = async (data: Partial<Technician>) => {
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
  return newTech as Technician;
};