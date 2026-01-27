import { supabase } from '../db';

export interface RoleApplication {
    id?: string;
    userId: string;
    requestedRole: 'technician' | 'delivery';
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
                status: data.status,
                documents: data.documents,
                notes: data.notes,
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
        .select('*, user:User(*)')
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
