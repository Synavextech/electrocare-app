import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';
import TrackingInterface from '../components/TrackingInterface';
import useSocket from '../hooks/useSocket';

const Tracking: React.FC = () => {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data: repairs, isLoading: repairsLoading } = useQuery({
    queryKey: ['repairs'],
    queryFn: () => apiClient.get('/repairs').then((res) => res.data),
  });

  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ['myPurchases'],
    queryFn: () => apiClient.get('/marketplace/my-purchases').then((res) => res.data),
  });

  const { data: updates, isLoading: updatesLoading } = useQuery({
    queryKey: ['updates'],
    queryFn: () => apiClient.get('/tracking/updates').then((res) => res.data),
  });

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['myPurchases'] });
      queryClient.invalidateQueries({ queryKey: ['updates'] });
    };

    socket.on('repair_update', handleUpdate);
    socket.on('tracking_update', handleUpdate);
    socket.on('delivery_request', handleUpdate);
    socket.on('purchase_update', handleUpdate);

    return () => {
      socket.off('repair_update', handleUpdate);
      socket.off('tracking_update', handleUpdate);
      socket.off('delivery_request', handleUpdate);
      socket.off('purchase_update', handleUpdate);
    };
  }, [socket, queryClient]);

  if (repairsLoading || updatesLoading || purchasesLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/30 animate-pulse">
      <div className="text-6xl mb-4">🚚</div>
      <p className="text-xl font-black uppercase tracking-widest">Locating your devices & orders...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Hero Header */}
      <section className="glass-card rounded-[2.5rem] p-12 border border-white/10 shadow-premium relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 blur-[120px] -mr-48 -mt-48 transition-premium"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-4 block">Fleet Tracking</span>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter">
            Real-Time <span className="text-accent">Updates.</span>
          </h1>
          <p className="text-white/60 text-xl font-medium leading-relaxed">
            Monitor your repair services and purchased devices from transit to delivery. Stay informed every step of the way.
          </p>
        </div>
      </section>

      <TrackingInterface repairs={repairs || []} purchases={purchases || []} updates={updates || []} />
    </div>
  );
};

export default Tracking;
