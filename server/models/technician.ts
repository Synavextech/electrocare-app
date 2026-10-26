import { supabase } from '../db.js';

export interface Technician {
  id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  email: string;
  rating: number;
  reviews: number;
  category: string;
  subCategory: string;
  shopId: string;
  status?: string;
  statusNote?: string | null;
  createdAt: string;
  shop?: {
    id: string;
    name: string;
    address: string;
    county: string;
    status?: string;
  };
}

export const getTechniciansByShop = async (shopId?: string) => {
  let query = supabase.from('Technicians').select('*, shop:Shops(id, name, address, county, status)');
  if (shopId) {
    query = query.eq('shopId', shopId);
  }
  const { data, error } = await query.order('name', { ascending: true });
  if (error) {
    console.error('getTechniciansByShop Error:', error);
    throw error;
  }
  return data as Technician[];
};

export const getTechnicianById = async (id: string) => {
  const { data, error } = await supabase
    .from('Technicians')
    .select('*, shop:Shops(id, name, address, county, status)')
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
        status: data.status || 'active',
        statusNote: data.statusNote || null,
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

export const updateTechnicianStatus = async (id: string, status: string, statusNote?: string | null) => {
  const { data, error } = await supabase
    .from('Technicians')
    .update({
      status,
      statusNote: statusNote !== undefined ? statusNote : null,
    })
    .eq('id', id)
    .select('*, shop:Shops(id, name, address, county, status)')
    .single();

  if (error) throw error;
  return data as Technician;
};

export const updateTechnician = async (id: string, updates: Partial<Technician>) => {
  const payload: any = { ...updates };
  delete payload.id;
  delete payload.createdAt;
  delete payload.shop;

  const { data, error } = await supabase
    .from('Technicians')
    .update(payload)
    .eq('id', id)
    .select('*, shop:Shops(id, name, address, county, status)')
    .single();

  if (error) throw error;
  return data as Technician;
};

export const deleteTechnicianRecord = async (id: string) => {
  // 1. Fetch technician to find userId
  const { data: tech } = await supabase
    .from('Technicians')
    .select('id, userId, name')
    .eq('id', id)
    .single();

  // 2. Delete technician from Technicians table
  const { error: delError } = await supabase
    .from('Technicians')
    .delete()
    .eq('id', id);

  if (delError) {
    console.error('deleteTechnicianRecord Error:', delError);
    throw delError;
  }

  // 3. If linked to a User account, revert user role back to 'user'
  if (tech?.userId) {
    await supabase
      .from('User')
      .update({ role: 'user' })
      .eq('id', tech.userId);
  }

  return { success: true, message: `Technician ${tech?.name || id} deleted and role reverted to user` };
};

export const transferTechnicianShop = async (id: string, newShopId: string) => {
  const { data, error } = await supabase
    .from('Technicians')
    .update({ shopId: newShopId })
    .eq('id', id)
    .select('*, shop:Shops(id, name, address, county, status)')
    .single();

  if (error) {
    console.error('transferTechnicianShop Error:', error);
    throw error;
  }
  return data as Technician;
};

export interface TechnicianReportInput {
  technicianId: string;
  technicianName?: string;
  shopId?: string;
  reporterUserId: string;
  reason: string;
  details?: string;
}

export const createTechnicianReport = async (input: TechnicianReportInput) => {
  let techName = input.technicianName;
  let resolvedShopId = input.shopId;
  if (!techName || !resolvedShopId) {
    const { data: tech } = await supabase
      .from('Technicians')
      .select('name, shopId')
      .eq('id', input.technicianId)
      .maybeSingle();
    if (tech) {
      if (!techName) techName = tech.name;
      if (!resolvedShopId) resolvedShopId = tech.shopId;
    }
  }

  const { data, error } = await supabase
    .from('TechnicianReport')
    .insert({
      technicianId: input.technicianId,
      technicianName: techName || 'Specialist',
      shopId: resolvedShopId || null,
      reporterUserId: input.reporterUserId,
      reason: input.reason,
      details: input.details || null,
      status: 'pending'
    })
    .select('*, shop:Shops(id, name), technician:Technicians(id, name, email, rating)')
    .single();

  if (error) {
    console.warn('Could not insert into TechnicianReport table directly (table may need creation), returning fallback:', error.message);
    return {
      id: `rep-${Date.now()}`,
      technicianId: input.technicianId,
      technicianName: techName,
      shopId: resolvedShopId,
      reason: input.reason,
      details: input.details,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
  }
  return data;
};

export const getTechnicianReportsList = async () => {
  const { data, error } = await supabase
    .from('TechnicianReport')
    .select('*, shop:Shops(id, name, address, county), technician:Technicians(id, name, email, rating, phone, status)')
    .order('createdAt', { ascending: false });

  if (error) {
    console.warn('getTechnicianReportsList query notice:', error.message);
    return [];
  }
  return data || [];
};

export const updateTechnicianReportStatus = async (id: string, status: string, resolutionNotes?: string) => {
  const { data, error } = await supabase
    .from('TechnicianReport')
    .update({
      status,
      resolutionNotes: resolutionNotes || null
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateTechnicianReportStatus Error:', error);
    throw error;
  }
  return data;
};