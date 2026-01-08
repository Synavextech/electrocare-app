import { supabase } from '../db';
import { z } from 'zod';

export interface RepairRequest {
  id: string;
  request_id: string;
  userId: string;
  technicianId?: string;
  shopId?: string;
  deliveryPersonnelId?: string;
  device_type: string;
  device_model: string;
  issue: string;
  status: string;
  delivery: boolean;
  trackingNumber?: string;
  cost?: number;
  paymentMethod?: 'online' | 'cod';
  discount?: number;
  estimatedTime?: number;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const RepairSchema = z.object({
  device_type: z.string(),
  device_model: z.string().optional(),
  issue: z.string(),
  delivery: z.boolean().optional(),
  shopId: z.string().optional(),
  technicianId: z.string().optional(),
  deliveryPersonnelId: z.string().optional(),
  paymentMethod: z.enum(['online', 'cod']).optional(),
});

export const createRepair = async (data: any) => {
  // Generate Device Serialization: EC/YYYYMMDD/NNN
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  // Get count of repairs for today to determine NNN
  const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();

  const { count, error: countError } = await supabase
    .from('RepairRequest')
    .select('*', { count: 'exact', head: true })
    .gte('createdAt', startOfDay)
    .lte('createdAt', endOfDay);

  if (countError) throw countError;

  const sequence = String((count || 0) + 1).padStart(3, '0');
  const request_id = `EC/${dateStr}/${sequence}`;

  // Apply discount if online payment
  let discount = 0;
  if (data.paymentMethod === 'online') {
    discount = 10; // 10% discount logic
  }

  const { data: repair, error } = await supabase
    .from('RepairRequest')
    .insert({
      request_id,
      userId: data.userId,
      device_type: data.device_type,
      device_model: data.device_model,
      issue: data.issue,
      delivery: data.delivery || false,
      shopId: data.shopId,
      technicianId: data.technicianId,
      deliveryPersonnelId: data.deliveryPersonnelId,
      paymentMethod: data.paymentMethod || 'cod',
      discount: discount,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return repair;
};

export const getRepairsByUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('RepairRequest')
    .select('*')
    .eq('userId', userId);

  if (error) throw error;
  return data;
};

export const getRepairById = async (id: string) => {
  const { data, error } = await supabase
    .from('RepairRequest')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const updateRepair = async (id: string, data: Partial<RepairRequest>) => {
  const { data: repair, error } = await supabase
    .from('RepairRequest')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return repair;
};