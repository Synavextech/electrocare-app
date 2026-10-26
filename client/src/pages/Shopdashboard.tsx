import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';
import useAuth from '../hooks/useAuth';

const ShopDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'services' | 'repairs' | 'marketplace' | 'dead-phones' | 'technicians'>('services');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // Modals state
  const [showPostDeviceModal, setShowPostDeviceModal] = useState(false);
  const [showReportTechModal, setShowReportTechModal] = useState(false);
  const [selectedTechForReport, setSelectedTechForReport] = useState<any>(null);
  const [reportReason, setReportReason] = useState('Customer Complaint');
  const [reportNotes, setReportNotes] = useState('');

  // Post device form state
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceCategory, setNewDeviceCategory] = useState('Mobile Devices');
  const [newDeviceSubCategory, setNewDeviceSubCategory] = useState('Smartphones');
  const [newDeviceCondition, setNewDeviceCondition] = useState<'New' | 'Refurbished'>('Refurbished');
  const [newDevicePrice, setNewDevicePrice] = useState<number | string>('');
  const [newDeviceStock, setNewDeviceStock] = useState<number>(1);
  const [newDeviceImageUrl, setNewDeviceImageUrl] = useState('');
  const [newDeviceDescription, setNewDeviceDescription] = useState('');

  // Dead Phone custom award state
  const [deadPhoneAwards, setDeadPhoneAwards] = useState<{ [key: string]: { points: number; cash: number } }>({});

  // Shop identity
  const myShopId = user?.role === 'shop' ? user.id : 'SHOP-001';

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
    enabled: activeTab === 'marketplace' || activeTab === 'dead-phones',
  });

  const { data: repairRequests } = useQuery({
    queryKey: ['repairRequests', myShopId],
    queryFn: () => apiClient.get(`/repairs`).then((res) => res.data),
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
    mutationFn: ({ saleId, points, cash }: { saleId: string; points: number; cash?: number }) =>
      apiClient.post('/admin/approve-sale', { saleId, points, cash }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingSales'] });
      alert('Device inspection approved and rewards credited to user wallet!');
    },
  });

  const acceptRepairMutation = useMutation({
    mutationFn: ({ repairId, cost, time }: { repairId: string; cost: number; time: string }) =>
      apiClient.post(`/repairs/accept/${repairId}`, { estimatedCost: cost, estimatedTime: time }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairRequests'] });
      alert('Repair request accepted!');
    },
  });

  const assignRepairMutation = useMutation({
    mutationFn: ({ repairId, technicianId }: { repairId: string; technicianId: string }) =>
      apiClient.patch(`/repairs/${repairId}`, { technicianId, status: 'assigned' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairRequests'] });
    }
  });

  const requestDeliveryMutation = useMutation({
    mutationFn: ({ repairId, riderType }: { repairId: string; riderType: string }) =>
      apiClient.post(`/repairs/${repairId}/request-delivery`, { riderType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairRequests'] });
      alert('Delivery rider dispatch request sent to fleet!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to request delivery');
    }
  });

  const reportTechnicianMutation = useMutation({
    mutationFn: (data: { technicianId: string; reason: string; notes: string }) =>
      apiClient.post(`/technician/${data.technicianId}/report`, {
        reason: data.reason,
        notes: data.notes,
      }),
    onSuccess: () => {
      setShowReportTechModal(false);
      setSelectedTechForReport(null);
      setReportNotes('');
      alert('Technician report filed directly to Administrator!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to file technician report');
    }
  });

  const postDeviceMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/marketplace', data),
    onSuccess: () => {
      setShowPostDeviceModal(false);
      setNewDeviceName('');
      setNewDevicePrice('');
      setNewDeviceDescription('');
      setNewDeviceImageUrl('');
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      alert('New/Refurbished Device listed directly to marketplace under your shop!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to post device');
    }
  });

  const [repairFeedback, setRepairFeedback] = useState<{ [key: string]: { cost: string; time: string } }>({});

  const toggleModel = (id: string) => {
    setSelectedModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const deadPhones = pendingSales?.filter((s: any) => s.condition === 'Unusable') || [];
  const standardPendingSales = pendingSales?.filter((s: any) => s.condition !== 'Unusable') || [];

  if (modelsLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/30 animate-pulse">
      <div className="text-6xl mb-4">🏬</div>
      <p className="text-xl font-black uppercase tracking-widest">Loading Merchant Console...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Hero Header with Assigned Shop Badge */}
      <section className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-white/10 shadow-premium relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 blur-[120px] -mr-48 -mt-48 transition-premium"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-brand block">Merchant Command Hub</span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand/20 text-brand border border-brand/30 flex items-center gap-1.5">
                <span>🏬</span> Verified Shop: {user?.name || 'Central Hub'} ({myShopId.slice(0, 8)})
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter">
              Shop <span className="text-brand">Manager.</span>
            </h1>
            <p className="text-white/60 text-sm max-w-xl">
              Inspect repairs, dispatch delivery personnel, approve dead phone trade-ins, and post refurbished inventory.
            </p>
          </div>

          <button
            onClick={() => setShowPostDeviceModal(true)}
            className="premium-gradient text-[#03131e] px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-premium shadow-xl flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>📱</span> Post New / Refurbished Device
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-white/10">
          {[
            { id: 'services', label: 'Repair Services', icon: '🛠️' },
            { id: 'repairs', label: `Active Repairs (${repairRequests?.length || 0})`, icon: '🔧' },
            { id: 'marketplace', label: `Marketplace (${standardPendingSales.length})`, icon: '🛒' },
            { id: 'dead-phones', label: `Dead Phone Approvals (${deadPhones.length})`, icon: '💀' },
            { id: 'technicians', label: 'Our Experts', icon: '👨‍🔧' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-premium border flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'vibrant-gradient text-white border-transparent shadow-lg'
                  : 'glass-card text-white/50 border-white/5 hover:border-brand/30 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="animate-in slide-in-from-bottom-8 duration-500">
        {/* Services Tab */}
        {activeTab === 'services' && (
          <section className="space-y-8">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-black text-white tracking-widest uppercase">Select Supported Repair Models</h2>
                <p className="text-white/40 text-xs mt-1">Select the devices your shop can inspect, repair, and service.</p>
              </div>
              <button
                onClick={() => saveServicesMutation.mutate(selectedModels)}
                disabled={saveServicesMutation.isPending}
                className="vibrant-gradient text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest transition-premium hover:shadow-2xl disabled:opacity-50 cursor-pointer"
              >
                Save Services
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
              {models?.map((model: any) => (
                <div
                  key={model.id}
                  onClick={() => toggleModel(model.id)}
                  className={`glass-card p-6 rounded-3xl border transition-premium cursor-pointer group ${
                    selectedModels.includes(model.id) ? 'border-brand bg-brand/10' : 'border-white/5 hover:border-brand/30'
                  }`}
                >
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-premium">📱</div>
                  <h3 className="text-sm font-bold text-white truncate">{model.name}</h3>
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">{model.brand}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Repairs Tab */}
        {activeTab === 'repairs' && (
          <section className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-white tracking-widest uppercase">Service & Repair Requests</h2>
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-white/60">
                Standard Courier Dispatch Fee: KES 200.00
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {repairRequests?.map((repair: any) => {
                const isCompleted = repair.status === 'completed';
                const isActive = repair.status === 'assigned' || repair.status === 'in_progress' || repair.status === 'accepted';
                return (
                  <div key={repair.id} className="glass-card p-8 rounded-2xl border border-white/5 group hover:border-brand/30 transition-premium">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-white font-bold text-xl">{repair.device_type}</h4>
                          <span className="text-brand text-xs font-semibold">{repair.device_model}</span>
                        </div>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">
                          Ticket: {repair.request_id || repair.id} • Assigned Shop: {myShopId.slice(0, 8)}
                        </p>
                        <p className="text-white/70 text-sm italic bg-white/[0.02] p-3 rounded-xl border border-white/5 max-w-2xl">
                          "{repair.issue}"
                        </p>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          repair.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : repair.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                            : 'bg-brand/20 text-brand border border-brand/30'
                        }`}>
                          {repair.status}
                        </span>

                        {repair.cost && (
                          <span className="text-base font-black text-white">
                            KES {Number(repair.cost).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                      {repair.status === 'pending' ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="number"
                              placeholder="Cost (KES)"
                              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-brand"
                              value={repairFeedback[repair.id]?.cost || ''}
                              onChange={(e) => setRepairFeedback({ ...repairFeedback, [repair.id]: { ...repairFeedback[repair.id], cost: e.target.value } })}
                            />
                            <input
                              type="text"
                              placeholder="Time (e.g. 2 hrs)"
                              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-brand"
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
                            className="w-full vibrant-gradient text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg transition-premium disabled:opacity-50 cursor-pointer"
                          >
                            Accept Repair Request
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Assign Technician</span>
                            <select
                              value={repair.technicianId || repair.technician_id || ''}
                              onChange={(e) => assignRepairMutation.mutate({ repairId: repair.id, technicianId: e.target.value })}
                              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none cursor-pointer"
                            >
                              <option value="">Assign technician...</option>
                              {technicians?.map((t: any) => (
                                <option key={t.id} value={t.id} className="bg-canvas">{t.name} ({t.category || 'Tech'})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Dispatch & Operations Section */}
                      <div className="flex flex-col justify-between items-start md:items-end gap-4">
                        <div className="flex flex-wrap gap-2 justify-end w-full">
                          {/* Active repair delivery personnel dispatch */}
                          {isActive && (
                            <button
                              onClick={() => requestDeliveryMutation.mutate({ repairId: repair.id, riderType: 'pickup' })}
                              disabled={requestDeliveryMutation.isPending}
                              className="px-5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase tracking-wider hover:bg-cyan-500/30 transition-premium cursor-pointer"
                            >
                              🚚 Request Delivery Personnel
                            </button>
                          )}

                          {/* Completed repair return delivery dispatch */}
                          {isCompleted && (
                            <button
                              onClick={() => requestDeliveryMutation.mutate({ repairId: repair.id, riderType: 'return' })}
                              disabled={requestDeliveryMutation.isPending}
                              className="px-5 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider hover:bg-emerald-500/30 transition-premium cursor-pointer"
                            >
                              🛵 Request Delivery Rider (Return)
                            </button>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-white/40 text-[10px] font-black uppercase tracking-widest block mb-1">Assigned Shop Badge</span>
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand/10 text-brand border border-brand/20">
                            🏬 ElectroCare Shop #{myShopId.slice(0, 6)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {(!repairRequests || repairRequests.length === 0) && (
                <div className="glass-card p-20 rounded-[3rem] border border-dashed border-white/5 text-center text-white/20">
                  <p className="font-bold uppercase tracking-widest">No active repair requests</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Community Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <section className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-white tracking-widest uppercase">Community Marketplace Reviews</h2>
              <button
                onClick={() => setShowPostDeviceModal(true)}
                className="px-6 py-2.5 rounded-xl vibrant-gradient text-white text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                + Post Device
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {standardPendingSales.map((sale: any) => (
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
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest tracking-loose">
                          Seller: {sale.user?.name || 'Customer'}
                        </p>
                        <p className="text-brand text-[10px] font-bold uppercase">{sale.mainCategory} • {sale.subCategory}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-brand/20 text-brand rounded-full text-[8px] font-black uppercase tracking-widest">{sale.condition}</span>
                  </div>
                  <p className="text-white/60 text-xs mb-6 leading-relaxed line-clamp-2">{sale.description}</p>
                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <span className="text-2xl font-black text-white">KES {Number(sale.price).toLocaleString()}</span>
                    <button
                      onClick={() => approveSaleMutation.mutate({ saleId: sale.id, points: 20 })}
                      className="vibrant-gradient text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-premium cursor-pointer"
                    >
                      Approve & List
                    </button>
                  </div>
                </div>
              ))}
              {standardPendingSales.length === 0 && (
                <div className="col-span-2 glass-card p-16 rounded-3xl border border-dashed border-white/10 text-center text-white/30">
                  <p className="font-bold uppercase tracking-wider">No pending community listings</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Dead Phone Approvals Tab */}
        {activeTab === 'dead-phones' && (
          <section className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-white tracking-widest uppercase">Dead / Unused Device Approvals</h2>
                <p className="text-white/40 text-xs mt-1">
                  Inspect damaged or unrepairable devices submitted by users. Declare and award custom reward points or KES cash directly to their wallet.
                </p>
              </div>
              <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase bg-accent/20 text-accent border border-accent/30">
                Recycling Pipeline
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {deadPhones.map((sale: any) => {
                const currentAward = deadPhoneAwards[sale.id] || { points: 50, cash: 200 };
                return (
                  <div key={sale.id} className="glass-card p-8 rounded-[2rem] border border-white/10 hover:border-accent/40 transition-premium group relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                        {sale.imageUrls?.[0] ? (
                          <img src={sale.imageUrls[0]} alt="Dead Device" className="w-20 h-20 rounded-2xl object-cover border border-white/10" />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">💀</div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Dead Phone
                            </span>
                            <span className="text-[10px] text-white/40 font-bold uppercase">{sale.mainCategory}</span>
                          </div>
                          <h3 className="text-xl font-bold text-white mt-1 mb-1">{sale.device}</h3>
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                            Customer: {sale.user?.name || 'Customer'} • {sale.user?.phone || 'No phone'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 mb-6 text-xs text-white/70">
                      <p className="text-[10px] font-black uppercase text-accent mb-1 tracking-wider">Damage Assessment Notes</p>
                      <p className="line-clamp-3">{sale.description || 'No damage notes provided.'}</p>
                    </div>

                    {/* Custom Award Inputs */}
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-brand block mb-1">
                          Award Points (PTS)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={currentAward.points}
                          onChange={(e) => setDeadPhoneAwards({
                            ...deadPhoneAwards,
                            [sale.id]: { ...currentAward, points: Number(e.target.value) }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-bold outline-none focus:border-brand"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
                          Award Cash (KES)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={currentAward.cash}
                          onChange={(e) => setDeadPhoneAwards({
                            ...deadPhoneAwards,
                            [sale.id]: { ...currentAward, cash: Number(e.target.value) }
                          })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-bold outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-white/50">
                        Credited to user wallet on accept
                      </span>
                      <button
                        onClick={() => approveSaleMutation.mutate({
                          saleId: sale.id,
                          points: currentAward.points,
                          cash: currentAward.cash,
                        })}
                        disabled={approveSaleMutation.isPending}
                        className="vibrant-gradient text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-premium cursor-pointer disabled:opacity-50"
                      >
                        Accept & Credit Wallet
                      </button>
                    </div>
                  </div>
                );
              })}

              {deadPhones.length === 0 && (
                <div className="col-span-2 glass-card p-16 rounded-3xl border border-dashed border-white/10 text-center text-white/30">
                  <p className="font-bold uppercase tracking-wider">No dead phone inspection requests pending</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Technicians Tab */}
        {activeTab === 'technicians' && (
          <section className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-white tracking-widest uppercase">Our Experts</h2>
              <span className="text-xs text-white/40 font-bold uppercase">Affiliated Technicians</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {technicians?.map((tech: any) => (
                <div key={tech.id} className="glass-card p-8 rounded-[2rem] border border-white/5 hover:border-brand/30 transition-premium flex flex-col justify-between">
                  <div>
                    <div className="text-4xl mb-4">👨‍🔧</div>
                    <h3 className="text-xl font-bold text-white mb-1">{tech.name}</h3>
                    <p className="text-brand text-xs font-semibold mb-2">{tech.category || 'Hardware Specialist'}</p>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                      ID: {tech.id.slice(0, 8)} • Rating: {tech.rating || 4.8} ⭐
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                    <span className="text-emerald-400 font-bold text-xs">Active</span>
                    <button
                      onClick={() => {
                        setSelectedTechForReport(tech);
                        setShowReportTechModal(true);
                      }}
                      className="text-[10px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-premium border border-rose-500/20 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                    >
                      Report to Admin ⚠️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* MODAL 1: Post New / Refurbished Device */}
      {showPostDeviceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl glass-card rounded-[2.5rem] border border-white/20 p-8 md:p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand block mb-1">Direct Merchant Inventory</span>
                <h3 className="text-2xl font-black text-white">Post New / Refurbished Device</h3>
              </div>
              <button
                onClick={() => setShowPostDeviceModal(false)}
                className="w-10 h-10 rounded-full glass-card border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-premium cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newDeviceName || !newDevicePrice) {
                  return alert('Device title and price are required');
                }
                postDeviceMutation.mutate({
                  device: newDeviceName,
                  price: Number(newDevicePrice),
                  condition: newDeviceCondition,
                  mainCategory: newDeviceCategory,
                  subCategory: newDeviceSubCategory,
                  description: newDeviceDescription,
                  piecesAvailable: newDeviceStock,
                  imageUrls: newDeviceImageUrl ? [newDeviceImageUrl] : [],
                });
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-2">
                    Device Title & Model
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iPhone 13 Pro Max 256GB"
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    className="w-full glass-card border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-2">
                    Condition
                  </label>
                  <select
                    value={newDeviceCondition}
                    onChange={(e) => setNewDeviceCondition(e.target.value as any)}
                    className="w-full glass-card border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="New" className="bg-canvas">Brand New</option>
                    <option value="Refurbished" className="bg-canvas">Certified Refurbished</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-2">
                    Primary Category
                  </label>
                  <select
                    value={newDeviceCategory}
                    onChange={(e) => setNewDeviceCategory(e.target.value)}
                    className="w-full glass-card border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="Mobile Devices" className="bg-canvas">Mobile Devices</option>
                    <option value="Computers/Laptops" className="bg-canvas">Computers/Laptops</option>
                    <option value="Security devices and accessories" className="bg-canvas">Security & CCTV</option>
                    <option value="Gaming devices" className="bg-canvas">Gaming Gear</option>
                    <option value="Internet connection devices & services" className="bg-canvas">Internet Routers & MiFi</option>
                    <option value="Our flagship devices" className="bg-canvas">Flagship Hardware</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-2">
                    Sub-Category / Brand
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apple, Dell, TP-Link"
                    value={newDeviceSubCategory}
                    onChange={(e) => setNewDeviceSubCategory(e.target.value)}
                    className="w-full glass-card border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-2">
                    Price (Kenya Shillings - KES)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 45000"
                    value={newDevicePrice}
                    onChange={(e) => setNewDevicePrice(e.target.value)}
                    className="w-full glass-card border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-2">
                    Units in Stock
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newDeviceStock}
                    onChange={(e) => setNewDeviceStock(Math.max(1, Number(e.target.value)))}
                    className="w-full glass-card border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newDeviceImageUrl}
                  onChange={(e) => setNewDeviceImageUrl(e.target.value)}
                  className="w-full glass-card border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-2">
                  Device Description & Specifications
                </label>
                <textarea
                  rows={3}
                  placeholder="Battery health, cosmetic condition, warranty, accessories included..."
                  value={newDeviceDescription}
                  onChange={(e) => setNewDeviceDescription(e.target.value)}
                  className="w-full glass-card border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPostDeviceModal(false)}
                  className="flex-1 py-4 rounded-2xl glass-card border border-white/10 text-white/70 font-black uppercase tracking-wider text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postDeviceMutation.isPending}
                  className="flex-2 vibrant-gradient text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-xl transition-premium cursor-pointer disabled:opacity-50"
                >
                  {postDeviceMutation.isPending ? 'Publishing Device...' : 'List in Marketplace (KES)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Report Technician to Admin */}
      {showReportTechModal && selectedTechForReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md glass-card rounded-[2.5rem] border border-white/20 p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-400 block mb-1">Admin Escalation</span>
                <h3 className="text-xl font-black text-white">Report Technician</h3>
              </div>
              <button
                onClick={() => {
                  setShowReportTechModal(false);
                  setSelectedTechForReport(null);
                }}
                className="w-9 h-9 rounded-full glass-card border border-white/10 flex items-center justify-center text-white/50 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
              <p className="text-white font-bold">{selectedTechForReport.name}</p>
              <p className="text-white/40 text-[10px]">ID: {selectedTechForReport.id}</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                reportTechnicianMutation.mutate({
                  technicianId: selectedTechForReport.id,
                  reason: reportReason,
                  notes: reportNotes,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/70 block mb-2">
                  Complaint Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full glass-card border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option value="Customer Complaint" className="bg-canvas">Customer Complaint</option>
                  <option value="Delay in Repairs" className="bg-canvas">Unjustified Delay in Repairs</option>
                  <option value="Damaged Client Device" className="bg-canvas">Damaged Client Device</option>
                  <option value="Unprofessional Conduct" className="bg-canvas">Unprofessional Conduct</option>
                  <option value="Absenteeism" className="bg-canvas">Absenteeism / Unresponsive</option>
                  <option value="Other" className="bg-canvas">Other Policy Violation</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-white/70 block mb-2">
                  Incident Details & Evidence Notes
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe what occurred, associated repair ticket ID, and impact..."
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full glass-card border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportTechModal(false);
                    setSelectedTechForReport(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl glass-card border border-white/10 text-white/70 font-black uppercase tracking-wider text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportTechnicianMutation.isPending}
                  className="flex-2 bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-premium cursor-pointer disabled:opacity-50"
                >
                  {reportTechnicianMutation.isPending ? 'Filing Report...' : 'Submit to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopDashboard;