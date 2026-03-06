import { supabase } from '../db';

export interface DeviceType {
    id: string;
    name: string;
    icon: string;
    createdAt: string;
}

export interface DeviceModel {
    id: string;
    name: string;
    brand: string;
    deviceTypeId: string;
    createdAt: string;
}

export const getDeviceTypes = async () => {
    const { data, error } = await supabase
        .from('DeviceTypes')
        .select('*')
        .order('name');
    if (error) {
        console.error('getDeviceTypes Error:', error);
        throw error;
    }
    return data as DeviceType[];
};

export const getDeviceModels = async (deviceTypeId?: string) => {
    let query = supabase.from('DeviceModels').select('*');
    if (deviceTypeId) {
        query = query.eq('deviceTypeId', deviceTypeId);
    }
    const { data, error } = await query.order('name');
    if (error) {
        console.error('getDeviceModels Error:', error);
        throw error;
    }
    return data as DeviceModel[];
};

export const createDeviceType = async (name: string, icon: string) => {
    const { data, error } = await supabase
        .from('DeviceTypes')
        .insert([{ name, icon }])
        .select()
        .single();
    if (error) throw error;
    return data as DeviceType;
};

export const createDeviceModel = async (data: Partial<DeviceModel>) => {
    const { data: model, error } = await supabase
        .from('DeviceModels')
        .insert([data])
        .select()
        .single();
    if (error) throw error;
    return model as DeviceModel;
};

export const updateDeviceModelsBulk = async (models: DeviceModel[]) => {
    // This is to replicate the fs.writeFile behavior for bulk updates if needed
    // But usually we do individual inserts or upserts.
    const { error } = await supabase
        .from('DeviceModels')
        .upsert(models);
    if (error) throw error;
    return { message: 'Models updated successfully' };
};
