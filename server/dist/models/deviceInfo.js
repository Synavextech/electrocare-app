import { supabase } from '../db';
export const getDeviceTypes = async () => {
    const { data, error } = await supabase
        .from('DeviceTypes')
        .select('*')
        .order('name');
    if (error) {
        console.error('getDeviceTypes Error:', error);
        throw error;
    }
    return data;
};
export const getDeviceModels = async (deviceTypeId) => {
    let query = supabase.from('DeviceModels').select('*');
    if (deviceTypeId) {
        query = query.eq('deviceTypeId', deviceTypeId);
    }
    const { data, error } = await query.order('name');
    if (error) {
        console.error('getDeviceModels Error:', error);
        throw error;
    }
    return data;
};
export const createDeviceType = async (name, icon) => {
    const { data, error } = await supabase
        .from('DeviceTypes')
        .insert([{ name, icon }])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
export const createDeviceModel = async (data) => {
    const { data: model, error } = await supabase
        .from('DeviceModels')
        .insert([data])
        .select()
        .single();
    if (error)
        throw error;
    return model;
};
export const updateDeviceModelsBulk = async (models) => {
    // This is to replicate the fs.writeFile behavior for bulk updates if needed
    // But usually we do individual inserts or upserts.
    const { error } = await supabase
        .from('DeviceModels')
        .upsert(models);
    if (error)
        throw error;
    return { message: 'Models updated successfully' };
};
//# sourceMappingURL=deviceInfo.js.map