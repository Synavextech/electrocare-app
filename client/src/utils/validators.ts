import { z } from 'zod';  // Import Zod (stable 3.23.8; already in deps)

// Existing schemas (e.g., from previous fixes; add if missing)
export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  // Add role, etc., as needed
});
// Add this new export for repair validation (aligns with repairs table and form fields)
export const repairSchema = z.object({
  device_type: z.string().min(1, { message: 'Device type is required' }),  // e.g., 'phone', 'tablet'
  device_model: z.string().optional(),
  issue: z.string().min(1, { message: 'Issue description is required' }),  // e.g., 'screen crack'
  delivery: z.boolean().optional(),  // True for pickup/delivery; false for walk-in
  // Optional fields (add as per form; e.g., for cost, status if pre-set)
  cost: z.number().optional(),  // Calculated or user-input
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),  // Default 'pending'
  // Exclude DB-only like id, timestamps, user_id (handled backend)
});
export const saleSchema = z.object({
  condition: z.string().min(1, { message: 'Device condition is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: z.enum(['user', 'technician', 'delivery', 'admin', 'shop']).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});