import { supabase } from '../db.js';
import { z } from 'zod';

export interface CustomRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  preferredCondition?: string;
  budgetMax?: number;
  urgency?: 'low' | 'medium' | 'high';
  status: 'open' | 'fulfilled' | 'closed';
  imageUrls?: string[];
  offersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomOffer {
  id: string;
  requestId: string;
  sellerId: string;
  price: number;
  condition: string;
  description?: string;
  deliveryDays: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export const CustomRequestSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  category: z.string().min(1, 'Category is required'),
  preferredCondition: z.enum(['Any', 'New', 'Used', 'Refurbished']).optional(),
  budgetMax: z.number().positive().optional().nullable(),
  urgency: z.enum(['low', 'medium', 'high']).optional(),
  imageUrls: z.array(z.string()).optional(),
});

export const CustomOfferSchema = z.object({
  price: z.number().positive('Price must be greater than 0'),
  condition: z.string().min(1, 'Condition is required'),
  description: z.string().optional(),
  deliveryDays: z.number().min(1).default(2),
});

export const createCustomRequest = async (userId: string, data: any) => {
  const { data: request, error } = await supabase
    .from('CustomRequest')
    .insert({
      userId,
      title: data.title,
      description: data.description,
      category: data.category,
      preferredCondition: data.preferredCondition || 'Any',
      budgetMax: data.budgetMax || null,
      urgency: data.urgency || 'medium',
      imageUrls: data.imageUrls || [],
      status: 'open',
      offersCount: 0,
    })
    .select('*, user:User(*)')
    .single();

  if (error) throw error;
  return request;
};

export const getCustomRequests = async (options?: { userId?: string; category?: string; status?: string }) => {
  let query = supabase
    .from('CustomRequest')
    .select('*, user:User(id, name, email, phone)');

  if (options?.userId) {
    query = query.eq('userId', options.userId);
  }
  if (options?.category && options.category !== 'All') {
    query = query.eq('category', options.category);
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, error } = await query.order('createdAt', { ascending: false });
  if (error) throw error;
  return data;
};

export const getCustomRequestById = async (id: string) => {
  const { data: request, error: rErr } = await supabase
    .from('CustomRequest')
    .select('*, user:User(id, name, email, phone)')
    .eq('id', id)
    .single();

  if (rErr) throw rErr;

  const { data: offers, error: oErr } = await supabase
    .from('CustomOffer')
    .select('*, seller:User(id, name, email, role, phone)')
    .eq('requestId', id)
    .order('createdAt', { ascending: false });

  if (oErr) throw oErr;

  return {
    ...request,
    offers: offers || [],
  };
};

export const createCustomOffer = async (requestId: string, sellerId: string, data: any) => {
  const { data: offer, error } = await supabase
    .from('CustomOffer')
    .insert({
      requestId,
      sellerId,
      price: data.price,
      condition: data.condition,
      description: data.description || null,
      deliveryDays: data.deliveryDays || 2,
      status: 'pending',
    })
    .select('*, seller:User(id, name, email, role)')
    .single();

  if (error) throw error;

  // Increment offersCount on request
  const { count } = await supabase
    .from('CustomOffer')
    .select('*', { count: 'exact', head: true })
    .eq('requestId', requestId);

  await supabase
    .from('CustomRequest')
    .update({ offersCount: count || 1, updatedAt: new Date().toISOString() })
    .eq('id', requestId);

  return offer;
};

export const acceptCustomOffer = async (requestId: string, offerId: string, userId: string) => {
  // Verify user owns request
  const { data: request, error: rErr } = await supabase
    .from('CustomRequest')
    .select('*')
    .eq('id', requestId)
    .single();

  if (rErr || !request) throw new Error('Request not found');
  if (request.userId !== userId) throw new Error('Unauthorized to accept offers for this request');

  // Mark this offer accepted and others rejected
  await supabase
    .from('CustomOffer')
    .update({ status: 'accepted' })
    .eq('id', offerId);

  await supabase
    .from('CustomOffer')
    .update({ status: 'rejected' })
    .eq('requestId', requestId)
    .neq('id', offerId);

  // Mark request fulfilled
  const { data: updatedReq, error: uErr } = await supabase
    .from('CustomRequest')
    .update({ status: 'fulfilled', updatedAt: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();

  if (uErr) throw uErr;
  return updatedReq;
};
