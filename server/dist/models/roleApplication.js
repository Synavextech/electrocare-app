"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getPendingApplications = exports.createApplication = void 0;
const db_1 = require("../db");
const createApplication = async (data) => {
    const { data: application, error } = await db_1.supabase
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
    if (error)
        throw error;
    return application;
};
exports.createApplication = createApplication;
const getPendingApplications = async () => {
    const { data, error } = await db_1.supabase
        .from('RoleApplication')
        .select('*, user:User(*)')
        .eq('status', 'pending');
    if (error)
        throw error;
    return data;
};
exports.getPendingApplications = getPendingApplications;
const updateApplicationStatus = async (id, status) => {
    const { data, error } = await db_1.supabase
        .from('RoleApplication')
        .update({ status, updatedAt: new Date() })
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.updateApplicationStatus = updateApplicationStatus;
//# sourceMappingURL=roleApplication.js.map