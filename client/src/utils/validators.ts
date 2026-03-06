import { z } from 'zod';  // Import Zod (stable 3.23.8; already in deps)

// Existing schemas (e.g., from previous fixes; add if missing)
export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  // Add role, etc., as needed
});
// Add this new export for repair validation (aligns with repairs table and form fields)
export const repairSchema = z.object({
  device_type: z.string().min(1, { message: 'Device type is required' }),
  device_model: z.string().min(1, { message: 'Device model is required' }),
  issue: z.string().min(1, { message: 'Issue description is required' }),
  delivery: z.boolean().optional(),
  paymentMethod: z.enum(['cod', 'online']).default('cod'),
  cost: z.number().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
});

export const saleSchema = z.object({
  device: z.string().min(1, { message: 'Device name is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  price: z.number().positive({ message: 'Price must be positive' }),
  condition: z.enum(['New', 'Used', 'Refurbished', 'Unusable']),
  mainCategory: z.enum(['Mobile Phone', 'Laptop']),
  subCategory: z.enum(['Device', 'Accessory']),
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