import { supabase } from '../db.js';

export interface RoleApplication {
    id?: string;
    userId: string;
    requestedRole: 'technician' | 'delivery';
    phone?: string | null;
    shopId?: string | null;
    locality?: string | null;
    vehicleType?: string | null;
    deliveryFrequency?: string | null;
    preferredDevices?: string[];
    proficiency?: string[];
    experienceLevel?: string | null;
    metadata?: Record<string, any>;
    status: 'pending' | 'approved' | 'rejected';
    documents: string[];
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const createApplication = async (data: RoleApplication) => {
    const { data: application, error } = await supabase
        .from('RoleApplication')
        .insert([
            {
                userId: data.userId,
                requestedRole: data.requestedRole,
                phone: data.phone || null,
                shopId: data.shopId || null,
                locality: data.locality || null,
                vehicleType: data.vehicleType || null,
                deliveryFrequency: data.deliveryFrequency || null,
                preferredDevices: data.preferredDevices || [],
                proficiency: data.proficiency || [],
                experienceLevel: data.experienceLevel || null,
                metadata: data.metadata || {},
                status: data.status || 'pending',
                documents: data.documents || [],
                notes: data.notes || '',
            },
        ])
        .select()
        .single();

    if (error) throw error;
    return application;
};

export const getPendingApplications = async () => {
    const { data, error } = await supabase
        .from('RoleApplication')
        .select('*, user:User(*), shop:Shops(*)')
        .eq('status', 'pending');

    if (error) throw error;
    return data;
};

export const updateApplicationStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { data, error } = await supabase
        .from('RoleApplication')
        .update({ status, updatedAt: new Date() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};
