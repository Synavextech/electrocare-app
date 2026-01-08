import React from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';

const TechnicianApplication: React.FC = () => {
  const mutation = useMutation({
    mutationFn: () => apiClient.post('/recruitment/apply-technician'),
    onSuccess: () => alert('Application submitted successfully!'),
  });

  return (
    <button
      onClick={() => mutation.mutate()}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-premium text-sm font-bold text-white/80"
    >
      <span className="text-lg">👨‍🔧</span> Apply: Technician
    </button>
  );
};

export default TechnicianApplication;