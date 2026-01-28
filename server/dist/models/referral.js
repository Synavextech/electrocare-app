"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReferralsByUser = exports.createReferral = void 0;
const db_1 = require("../db");
const createReferral = async (data) => {
    const { data: referral, error } = await db_1.supabase
        .from('Referral')
        .insert({
        referrerId: data.referrerId,
        refereeId: data.refereeId,
        status: 'completed',
    })
        .select()
        .single();
    if (error)
        throw error;
    return referral;
};
exports.createReferral = createReferral;
const getReferralsByUser = async (userId) => {
    const { data, error } = await db_1.supabase
        .from('Referral')
        .select('*')
        .eq('referrerId', userId);
    if (error)
        throw error;
    return data;
};
exports.getReferralsByUser = getReferralsByUser;
//# sourceMappingURL=referral.js.map