"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTrackingLog = exports.getTrackingByRepair = void 0;
const db_1 = require("../db");
const getTrackingByRepair = async (repairRequestId) => {
    const { data, error } = await db_1.supabase
        .from('Tracking')
        .select('*')
        .eq('repairRequestId', repairRequestId);
    if (error)
        throw error;
    return data;
};
exports.getTrackingByRepair = getTrackingByRepair;
const createTrackingLog = async (data) => {
    const { data: log, error } = await db_1.supabase
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
exports.createTrackingLog = createTrackingLog;
//# sourceMappingURL=tracking.js.map