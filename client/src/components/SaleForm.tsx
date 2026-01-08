import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saleSchema } from '../utils/validators';

const SaleForm: React.FC<{ onSubmit: (data: any) => void }> = ({ onSubmit }) => {
  const { register, handleSubmit } = useForm({ resolver: zodResolver(saleSchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input {...register('device_condition')} placeholder="Condition" className="p-2 border rounded w-full" />
      <textarea {...register('description')} placeholder="Description" className="p-2 border rounded w-full" />
      <button type="submit" className="bg-primary text-white p-2 rounded">Sell Device</button>
    </form>
  );
};

export default SaleForm;