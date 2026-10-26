import { supabase } from '../db.js';
import { z } from 'zod';

export interface ServiceInquiry {
  id?: string;
  userId?: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceType: 'software_custom_app' | 'ai_configuration' | 'isp_management' | 'electron_network' | 'satellite_internet';
  targetEntity?: string;
  locationTown?: string | null;
  locationAddress?: string | null;
  urgency?: 'low' | 'medium' | 'high' | 'urgent';
  budget?: number | null;
  quotationKes?: number | null;
  details?: Record<string, any>;
  status?: 'pending' | 'reviewed' | 'contacted' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const ServiceInquirySchema = z.object({
  clientName: z.string().min(2, 'Name must be at least 2 characters'),
  clientEmail: z.string().email('Valid email address is required'),
  clientPhone: z.string().min(6, 'Valid contact phone number is required'),
  serviceType: z.enum([
    'software_custom_app',
    'ai_configuration',
    'isp_management',
    'electron_network',
    'satellite_internet'
  ]),
  targetEntity: z.enum(['home', 'office', 'institution', 'business', 'enterprise']).default('business'),
  locationTown: z.string().optional().nullable(),
  locationAddress: z.string().optional().nullable(),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  budget: z.number().positive().optional().nullable(),
  quotationKes: z.number().positive().optional().nullable(),
  details: z.record(z.any()).optional().default({}),
  notes: z.string().optional().nullable()
});

export const createServiceInquiry = async (userId: string | null | undefined, data: z.infer<typeof ServiceInquirySchema>) => {
  const { data: inquiry, error } = await supabase
    .from('ServiceInquiry')
    .insert([
      {
        userId: userId || null,
        clientName: data.clientName.trim(),
        clientEmail: data.clientEmail.trim().toLowerCase(),
        clientPhone: data.clientPhone.trim(),
        serviceType: data.serviceType,
        targetEntity: data.targetEntity,
        locationTown: data.locationTown || null,
        locationAddress: data.locationAddress || null,
        urgency: data.urgency,
        budget: data.budget || null,
        quotationKes: data.quotationKes || null,
        details: data.details || {},
        status: 'pending',
        notes: data.notes || null,
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return inquiry;
};

export const getServiceInquiries = async (filters: {
  serviceType?: string;
  userId?: string;
  status?: string;
}) => {
  let query = supabase
    .from('ServiceInquiry')
    .select('*')
    .order('createdAt', { ascending: false });

  if (filters.serviceType && filters.serviceType !== 'all') {
    query = query.eq('serviceType', filters.serviceType);
  }
  if (filters.userId) {
    query = query.eq('userId', filters.userId);
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getServiceInquiryById = async (id: string) => {
  const { data, error } = await supabase
    .from('ServiceInquiry')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const updateServiceInquiryStatus = async (id: string, status: string, notes?: string) => {
  const updatePayload: Record<string, any> = {
    status,
    updatedAt: new Date().toISOString()
  };
  if (notes !== undefined) {
    updatePayload.notes = notes;
  }

  const { data, error } = await supabase
    .from('ServiceInquiry')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
