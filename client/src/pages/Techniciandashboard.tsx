import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';

const Techniciandashboard: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'repairs' | 'marketplace' | 'dead-phones'>('repairs');

    const { data: assignments } = useQuery({
        queryKey: ['techAssignments'],
        queryFn: () => apiClient.get('/repairs/tech-assigned').then((res) => res.data),
        enabled: user?.role === 'technician',
    });

    const { data: pendingSales } = useQuery({
        queryKey: ['pendingSales'],
        queryFn: () => apiClient.get('/admin/pending-sales').then((res) => res.data),
        enabled: user?.role === 'technician' && (activeTab === 'marketplace' || activeTab === 'dead-phones'),
    });

    const approveSaleMutation = useMutation({
        mutationFn: ({ saleId, points }: { saleId: string, points: number }) =>
            apiClient.post('/admin/approve-sale', { saleId, points }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingSales'] });
        },
    });

    const updateRepairMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: string }) =>
            apiClient.patch(`/repairs/${id}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['techAssignments'] });
        }
    });

    const acceptRepairMutation = useMutation({
        mutationFn: ({ repairId, cost, time }: { repairId: string, cost: number, time: string }) =>
            apiClient.post(`/repairs/accept/${repairId}`, { estimatedCost: cost, estimatedTime: time }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['techAssignments'] });
            alert('Repair accepted!');
        },
    });

    const [repairFeedback, setRepairFeedback] = useState<{ [key: string]: { cost: string, time: string } }>({});
    const [selectedGalleryListing, setSelectedGalleryListing] = useState<any | null>(null);
    const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

    const filteredMarketplace = pendingSales?.filter((s: any) => s.condition !== 'Unusable') || [];
    const deadPhones = pendingSales?.filter((s: any) => s.condition === 'Unusable') || [];

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            <section className="glass-card rounded-[2rem] p-10 border border-white/10 shadow-premium relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                            Technician <span className="text-brand">Hub</span>
                        </h1>
                        <p className="text-white/60 text-xl font-medium">Welcome back, {user?.name || user?.email?.split('@')[0]}.</p>
                    </div>
                    <div className="flex gap-3">
                        {['repairs', 'marketplace', 'dead-phones'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-premium border ${activeTab === tab
                                    ? 'vibrant-gradient text-white border-transparent'
                                    : 'glass-card text-white/40 border-white/5 hover:border-brand/30'
                                    }`}
                            >
                                {tab.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {activeTab === 'repairs' && (
                <section className="space-y-8 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase">Assigned Repairs</h2>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-brand/50 to-transparent"></div>
                    </div>

                    {assignments?.length === 0 ? (
                        <div className="glass-card p-20 rounded-[3rem] border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-white/10">
                            <div className="text-6xl mb-6">🔩</div>
                            <p className="font-bold uppercase tracking-[0.2em]">No repairs assigned</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {assignments?.map((repair: any) => (
                                <div key={repair.id} className="glass-card p-8 rounded-2xl border border-white/5 group hover:border-brand/30 transition-premium">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-3xl">🔧</div>
                                            <div>
                                                <h4 className="text-white font-bold text-xl">{repair.device_type} <span className="text-white/40 text-sm">{repair.device_model}</span></h4>
                                                <p className="text-white/40 text-[10px] uppercase font-black tracking-widest leading-none mt-2">
                                                    {repair.id} • <span className="text-brand">{repair.status}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white/60 text-sm italic mb-4">"{repair.issue}"</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5">
                                        {repair.status === 'pending' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black uppercase text-white/20 ml-1">Est. Cost ($)</label>
                                                        <input
                                                            type="number"
                                                            placeholder="0.00"
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none"
                                                            value={repairFeedback[repair.id]?.cost || ''}
                                                            onChange={(e) => setRepairFeedback({ ...repairFeedback, [repair.id]: { ...repairFeedback[repair.id], cost: e.target.value } })}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black uppercase text-white/20 ml-1">Est. Time</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. 1hr"
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none"
                                                            value={repairFeedback[repair.id]?.time || ''}
                                                            onChange={(e) => setRepairFeedback({ ...repairFeedback, [repair.id]: { ...repairFeedback[repair.id], time: e.target.value } })}
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => acceptRepairMutation.mutate({
                                                        repairId: repair.id,
                                                        cost: Number(repairFeedback[repair.id]?.cost),
                                                        time: repairFeedback[repair.id]?.time
                                                    })}
                                                    disabled={!repairFeedback[repair.id]?.cost || !repairFeedback[repair.id]?.time}
                                                    className="premium-brand-gradient text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg disabled:opacity-50"
                                                >
                                                    Accept & Quote
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-4">
                                                    <div className="glass-card px-4 py-2 rounded-lg border border-white/5">
                                                        <p className="text-[8px] font-black text-white/20 uppercase">Cost</p>
                                                        <p className="text-sm font-black text-white">${repair.estimatedCost || '0'}</p>
                                                    </div>
                                                    <div className="glass-card px-4 py-2 rounded-lg border border-white/5">
                                                        <p className="text-[8px] font-black text-white/20 uppercase">Time</p>
                                                        <p className="text-sm font-black text-white">{repair.estimatedTime || 'N/A'}</p>
                                                    </div>
                                                    {repair.accepted_at && (
                                                        <div className="glass-card px-4 py-2 rounded-lg border border-brand/20 bg-brand/5">
                                                            <p className="text-[8px] font-black text-brand/60 uppercase">Countdown</p>
                                                            <p className="text-sm font-black text-brand tabular-nums">
                                                                {(() => {
                                                                    const elapsed = Math.floor((Date.now() - new Date(repair.accepted_at).getTime()) / 1000);
                                                                    const remaining = Math.max(0, 900 - elapsed);
                                                                    const mins = Math.floor(remaining / 60);
                                                                    const secs = remaining % 60;
                                                                    return `${mins}:${secs.toString().padStart(2, '0')}`;
                                                                })()}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => updateRepairMutation.mutate({ id: repair.id, status: 'repair_complete' })}
                                                    className="vibrant-gradient text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Mark as Complete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {activeTab === 'marketplace' && (
                <section className="space-y-8 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase">Listing Reviews</h2>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-brand/50 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {filteredMarketplace.map((sale: any) => (
                            <div key={sale.id} className="glass-card p-8 rounded-[2rem] border border-white/5 group hover:border-brand/30 transition-premium">
                                <div className="mb-6 relative group">
                                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                                        {sale.imageUrls && sale.imageUrls.length > 0 ? (
                                            sale.imageUrls.map((url: string, i: number) => (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        setSelectedGalleryListing(sale);
                                                        setActiveGalleryIndex(i);
                                                    }}
                                                    className="min-w-[100px] h-20 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 cursor-pointer hover:border-brand transition-premium snap-start"
                                                >
                                                    <img src={url} alt="Device" className="w-full h-full object-cover" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center text-3xl">📱</div>
                                        )}
                                    </div>
                                    <span className="absolute -top-3 right-0 px-3 py-1 bg-brand/10 text-brand rounded-full text-[8px] font-black uppercase tracking-widest">{sale.condition}</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{sale.device}</h3>
                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Seller: {sale.user?.name}</p>
                                </div>
                                <p className="text-white/60 text-xs mb-6 line-clamp-2 leading-relaxed">{sale.description}</p>
                                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                                    <span className="text-2xl font-black text-white">${sale.price}</span>
                                    <button
                                        onClick={() => approveSaleMutation.mutate({ saleId: sale.id, points: 10 })}
                                        className="vibrant-gradient text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-premium"
                                    >
                                        Approve Listing
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredMarketplace.length === 0 && (
                            <p className="text-white/20 uppercase font-black tracking-widest">No listings to review</p>
                        )}
                    </div>
                </section>
            )}

            {activeTab === 'dead-phones' && (
                <section className="space-y-8 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase">Deadphone Processing</h2>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-accent/50 to-transparent"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {deadPhones.map((sale: any) => (
                            <div key={sale.id} className="glass-card p-8 rounded-[2rem] border border-accent/10 bg-accent/5">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white mb-2">{sale.device}</h3>
                                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x mb-4">
                                            {sale.imageUrls?.map((url: string, i: number) => (
                                                <div
                                                    key={i}
                                                    onClick={() => {
                                                        setSelectedGalleryListing(sale);
                                                        setActiveGalleryIndex(i);
                                                    }}
                                                    className="min-w-[80px] h-16 rounded-lg overflow-hidden border border-white/5 flex-shrink-0 cursor-pointer hover:border-accent transition-premium snap-start"
                                                >
                                                    <img src={url} alt="Dead Device" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-[10px] font-black uppercase tracking-widest">DEAD PHONE</span>
                                </div>
                                <p className="text-white/40 text-sm mb-6">{sale.description}</p>
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div>
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Suggested Reward</p>
                                        <p className="text-2xl font-black text-accent">50 Points</p>
                                    </div>
                                    <button
                                        onClick={() => approveSaleMutation.mutate({ saleId: sale.id, points: 50 })}
                                        className="bg-accent text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-premium"
                                    >
                                        Confirm & Award
                                    </button>
                                </div>
                            </div>
                        ))}
                        {deadPhones.length === 0 && (
                            <p className="text-white/20 uppercase font-black tracking-widest">No dead phones to process</p>
                        )}
                    </div>
                </section>
            )}

            {/* Gallery Modal */}
            {selectedGalleryListing && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-canvas/90 backdrop-blur-2xl" onClick={() => setSelectedGalleryListing(null)}></div>
                    <div className="relative w-full max-w-5xl glass-card rounded-[3rem] border border-white/10 shadow-premium overflow-hidden animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setSelectedGalleryListing(null)}
                            className="absolute top-8 right-8 text-white/40 hover:text-white transition-premium z-20"
                        >
                            <span className="text-3xl font-black">✕</span>
                        </button>

                        <div className="p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="md:col-span-2 space-y-6">
                                <div className="aspect-video bg-white/5 rounded-[2rem] overflow-hidden border border-white/10 relative group">
                                    <img
                                        src={selectedGalleryListing.imageUrls?.[activeGalleryIndex]}
                                        alt="Full View"
                                        className="w-full h-full object-contain"
                                    />
                                    {selectedGalleryListing.imageUrls?.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setActiveGalleryIndex(prev => (prev === 0 ? selectedGalleryListing.imageUrls!.length - 1 : prev - 1))}
                                                className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-xl p-4 rounded-full text-white opacity-0 group-hover:opacity-100 transition-premium"
                                            >
                                                ←
                                            </button>
                                            <button
                                                onClick={() => setActiveGalleryIndex(prev => (prev === selectedGalleryListing.imageUrls!.length - 1 ? 0 : prev + 1))}
                                                className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-xl p-4 rounded-full text-white opacity-0 group-hover:opacity-100 transition-premium"
                                            >
                                                →
                                            </button>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                    {selectedGalleryListing.imageUrls?.map((url: string, i: number) => (
                                        <div
                                            key={i}
                                            onClick={() => setActiveGalleryIndex(i)}
                                            className={`min-w-[100px] h-24 rounded-2xl overflow-hidden border cursor-pointer transition-premium ${activeGalleryIndex === i ? 'border-brand' : 'border-white/5 opacity-50'}`}
                                        >
                                            <img src={url} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-brand mb-4 block">Detailed Inspection</span>
                                <h2 className="text-4xl font-black text-white mb-6 tracking-tighter">{selectedGalleryListing.device}</h2>
                                <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Seller</p>
                                        <p className="text-white font-bold">{selectedGalleryListing.user?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Condition</p>
                                        <p className="text-brand font-bold">{selectedGalleryListing.condition}</p>
                                    </div>
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Description</p>
                                        <p className="text-white/60 text-xs leading-relaxed max-h-40 overflow-y-auto">{selectedGalleryListing.description}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Techniciandashboard;
