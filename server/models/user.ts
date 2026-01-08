import { supabase } from '../db';
import { z } from 'zod';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'technician' | 'delivery' | 'admin' | 'shop';
  wallet?: {
    balance: number;
    points: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  password: z.string().min(8),
  role: z.enum(['user', 'technician', 'delivery', 'admin', 'shop']).optional(),
});

export const createUser = async (data: any) => {
  // This is now handled by Supabase Auth and Triggers.
  // But if we need to manually create a user (e.g. admin creating another admin), we use service role.
  // For normal signup, the controller should use supabase.auth.signUp

  // This function might be used by the seed script or tests.
  // We'll assume it's for creating a profile if it doesn't exist, or just returning the profile.
  return getUserByEmail(data.email);
};

export const getUserByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('User')
    .select('*, wallet:Wallet(*)')
    .eq('email', email)
    .single();

  if (error) return null;
  return data;
};

export const getUserById = async (id: string) => {
  const { data, error } = await supabase
    .from('User')
    .select('*, wallet:Wallet(*)')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
};

export const updateUser = async (id: string, data: Partial<User>) => {
  const { data: updatedUser, error } = await supabase
    .from('User')
    .update({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
    })
    .eq('id', id)
    .select('*, wallet:Wallet(*)')
    .single();

  if (error) throw error;
  return updatedUser;
};