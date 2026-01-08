import { supabase } from '../db';

export const createReferral = async (data: { referrerId: string; refereeId: string }) => {
  const { data: referral, error } = await supabase
    .from('Referral')
    .insert({
      referrerId: data.referrerId,
      refereeId: data.refereeId,
      status: 'completed',
    })
    .select()
    .single();

  if (error) throw error;
  return referral;
};

export const getReferralsByUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('Referral')
    .select('*')
    .eq('referrerId', userId);

  if (error) throw error;
  return data;
};