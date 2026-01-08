import { supabase } from '../db';
export const getTrackingByRepair = async (repairRequestId) => {
    const { data, error } = await supabase
        .from('Tracking')
        .select('*')
        .eq('repairRequestId', repairRequestId);
    if (error)
        throw error;
    return data;
};
export const createTrackingLog = async (data) => {
    const { data: log, error } = await supabase
        .from('Tracking')
        .insert({
        repairRequestId: data.repairId,
        status: data.status,
    })
        .select()
        .single();
    if (error)
        throw error;
    return log;
};
//# sourceMappingURL=tracking.js.map