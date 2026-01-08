import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';
import useAuth from '../hooks/useAuth';

const ShopDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'services' | 'repairs' | 'marketplace' | 'technicians'>('services');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // Assume shopId is linked to user or fetched from user's shop profile
  const myShopId = user?.role === 'shop' ? user.id : 'SHOP-001'; // Fallback for demo

  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => apiClient.get('/models').then((res) => res.data),
  });

  const { data: technicians } = useQuery({
    queryKey: ['technicians', myShopId],
    queryFn: () => apiClient.get(`/technician?shopId=${myShopId}`).then((res) => res.data),
    enabled: activeTab === 'technicians' || activeTab === 'repairs',
  });

  const { data: pendingSales } = useQuery({
    queryKey: ['pendingSales'],
    queryFn: () => apiClient.get('/admin/pending-sales').then((res) => res.data),
    enabled: activeTab === 'marketplace',
  });

  const { data: repairRequests } = useQuery({
    queryKey: ['repairRequests', myShopId],
    queryFn: () => apiClient.get(`/repairs`).then((res) => res.data), // In real app, filter by shopId on backend
    enabled: activeTab === 'repairs',
  });

  const saveServicesMutation = useMutation({
    mutationFn: (modelIds: string[]) =>
      apiClient.post(`/shop/${myShopId}/services`, { models: modelIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-services'] });
      alert('Services updated successfully!');
    },
  });

  const approveSaleMutation = useMutation({
    mutationFn: ({ saleId, points }: { saleId: string, points: number }) =>
      apiClient.post('/admin/approve-sale', { saleId, points }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingSales'] });
    },
  });

  const acceptRepairMutation = useMutation({
    mutationFn: ({ repairId, cost, time }: { repairId: string, cost: number, time: string }) =>
      apiClient.post(`/repairs/accept/${repairId}`, { estimatedCost: cost, estimatedTime: time }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairRequests'] });
      alert('Repair request accepted!');
    },
  });

  const assignRepairMutation = useMutation({
    mutationFn: ({ repairId, technicianId }: { repairId: string, technicianId: string }) =>
      apiClient.patch(`/repairs/${repairId}`, { technicianId, status: 'assigned' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairRequests'] });
    }
  });

  const [repairFeedback, setRepairFeedback] = useState<{ [key: string]: { cost: string, time: string } }>({});

  const toggleModel = (id: string) => {
    setSelectedModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  if (modelsLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/30 animate-pulse">
      <div className="text-6xl mb-4">🏬</div>
      <p className="text-xl font-black uppercase tracking-widest">Loading Merchant Console...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Hero Header avec Tabs */}
      <section className="glass-card rounded-[2.5rem] p-12 border border-white/10 shadow-premium relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 blur-[120px] -mr-48 -mt-48 transition-premium"></div>
        <div className="relative z-10">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-brand mb-4 block">Merchant Command</span>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter">
            Shop <span className="text-brand">Manager.</span>
          </h1>
          <div className="flex flex-wrap gap-4">
            {['services', 'repairs', 'marketplace', 'technicians'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-premium border ${activeTab === tab
                  ? 'vibrant-gradient text-white border-transparent'
                  : 'glass-card text-white/40 border-white/5 hover:border-brand/30'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="animate-in slide-in-from-bottom-8 duration-500">
        {activeTab === 'services' && (
          <section className="space-y-8">
            <div className="flex items-center justify-between gap-4 mb-8">
              <h2 className="text-3xl font-black text-white tracking-widest uppercase">Repair Models</h2>
              <button
                onClick={() => saveServicesMutation.mutate(selectedModels)}
                disabled={saveServicesMutation.isPending}
                className="vibrant-gradient text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest transition-premium hover:shadow-2xl disabled:opacity-50"
              >
                Save Services
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {models?.map((model: any) => (
                <div
                  key={model.id}
                  onClick={() => toggleModel(model.id)}
                  className={`glass-card p-6 rounded-3xl border transition-premium cursor-pointer group ${selectedModels.includes(model.id) ? 'border-brand bg-brand/10' : 'border-white/5'}`}
                >
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-premium">📱</div>
                  <h3 className="text-sm font-bold text-white truncate">{model.name}</h3>
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">{model.brand}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'repairs' && (
          <section className="space-y-8">
            <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-8">Service Requests</h2>
            <div className="grid grid-cols-1 gap-6">
              {repairRequests?.map((repair: any) => (
                <div key={repair.id} className="glass-card p-8 rounded-2xl border border-white/5 group hover:border-brand/30 transition-premium">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-white font-bold text-xl mb-1">{repair.device_type} <span className="text-white/40 text-sm">{repair.device_model}</span></h4>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">{repair.id} • {repair.status}</p>
                      <p className="text-white/60 text-sm italic">"{repair.issue}"</p>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${repair.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-brand/20 text-brand'}`}>
                      {repair.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                    {repair.status === 'pending' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="number"
                            placeholder="Cost ($)"
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none"
                            value={repairFeedback[repair.id]?.cost || ''}
                            onChange={(e) => setRepairFeedback({ ...repairFeedback, [repair.id]: { ...repairFeedback[repair.id], cost: e.target.value } })}
                          />
                          <input
                            type="text"
                            placeholder="Time (e.g. 2 hrs)"
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none"
                            value={repairFeedback[repair.id]?.time || ''}
                            onChange={(e) => setRepairFeedback({ ...repairFeedback, [repair.id]: { ...repairFeedback[repair.id], time: e.target.value } })}
                          />
                        </div>
                        <button
                          onClick={() => acceptRepairMutation.mutate({
                            repairId: repair.id,
                            cost: Number(repairFeedback[repair.id]?.cost),
                            time: repairFeedback[repair.id]?.time
                          })}
                          disabled={!repairFeedback[repair.id]?.cost || !repairFeedback[repair.id]?.time}
                          className="w-full vibrant-gradient text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-premium disabled:opacity-50"
                        >
                          Accept Repair Request
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Assign Technician</span>
                        <select
                          value={repair.technician_id || ''}
                          onChange={(e) => assignRepairMutation.mutate({ repairId: repair.id, technicianId: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none cursor-pointer"
                        >
                          <option value="">Assign technician...</option>
                          {technicians?.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex flex-col justify-end items-end gap-2">
                      {repair.accepted_at && (
                        <div className="text-right mb-2">
                          <p className="text-[8px] font-black uppercase text-brand/60 tracking-widest">Time Since Acceptance</p>
                          <p className="text-sm font-bold text-brand animate-pulse">
                            {(() => {
                              const elapsed = Math.floor((Date.now() - new Date(repair.accepted_at).getTime()) / 1000);
                              const remaining = Math.max(0, 900 - elapsed);
                              const mins = Math.floor(remaining / 60);
                              const secs = remaining % 60;
                              return `${mins}:${secs.toString().padStart(2, '0')} remaining`;
                            })()}
                          </p>
                        </div>
                      )}
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Service Details</p>
                      <button className="text-brand text-xs font-black uppercase tracking-widest hover:underline underline-offset-4 tracking-looser">Full Diagnostic Data →</button>
                    </div>
                  </div>
                </div>
              ))}
              {(!repairRequests || repairRequests.length === 0) && (
                <div className="glass-card p-20 rounded-[3rem] border border-dashed border-white/5 text-center text-white/20">
                  <p className="font-bold uppercase tracking-widest">No active repair requests</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'marketplace' && (
          <section className="space-y-8">
            <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-8">Community Marketplace Reviews</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pendingSales?.map((sale: any) => (
                <div key={sale.id} className="glass-card p-8 rounded-[2rem] border border-white/5 transition-premium hover:shadow-xl group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      {sale.imageUrls?.[0] ? (
                        <img src={sale.imageUrls[0]} alt="Device" className="w-16 h-16 rounded-xl object-cover" />
                      ) : (
                        <div className="text-4xl text-white/20">📱</div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{sale.device}</h3>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest tracking-loose">Seller: {sale.user?.name}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-brand/20 text-brand rounded-full text-[8px] font-black uppercase tracking-widest">{sale.condition}</span>
                  </div>
                  <p className="text-white/60 text-xs mb-6 leading-relaxed line-clamp-2">{sale.description}</p>
                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <span className="text-2xl font-black text-white">${sale.price}</span>
                    <button
                      onClick={() => approveSaleMutation.mutate({ saleId: sale.id, points: 20 })}
                      className="vibrant-gradient text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-premium"
                    >
                      Approve & List
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'technicians' && (
          <section className="space-y-8">
            <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-8">Our Experts</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {technicians?.map((tech: any) => (
                <div key={tech.id} className="glass-card p-8 rounded-[2rem] border border-white/5 hover:border-brand/30 transition-premium">
                  <div className="text-4xl mb-4">👨‍🔧</div>
                  <h3 className="text-xl font-bold text-white mb-2">{tech.name}</h3>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Technician ID: {tech.id}</p>
                  <div className="mt-6 flex justify-between items-center">
                    <span className="text-brand font-bold text-xs">Rating: 4.9 ⭐</span>
                    <button className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-premium">Stats</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ShopDashboard;