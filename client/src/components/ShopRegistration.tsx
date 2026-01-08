import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../utils/apiClient';

const shopSchema = z.object({
  name: z.string(),
  location: z.string(),
});

const ShopRegistration: React.FC = () => {
  const { register, handleSubmit } = useForm({ resolver: zodResolver(shopSchema) });
  const onSubmit = (data: any) => apiClient.post('/shops', data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input {...register('name')} placeholder="Shop Name" className="p-2 border rounded w-full" />
      <input {...register('location')} placeholder="Location (lat,long)" className="p-2 border rounded w-full" />
      <button type="submit" className="bg-primary text-white p-2 rounded">Register Shop</button>
    </form>
  );
};

export default ShopRegistration;