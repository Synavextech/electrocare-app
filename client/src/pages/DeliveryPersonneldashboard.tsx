import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';
import { Link } from '@tanstack/react-router';

const DeliveryPersonneldashboard: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'assignments' | 'marketplace'>('assignments');

    const { data: assignments } = useQuery({
        queryKey: ['deliveryAssignments'],
        queryFn: () => apiClient.get('/repairs/assigned').then((res) => res.data),
        enabled: user?.role === 'delivery',
    });

    const acceptDeliveryMutation = useMutation({
        mutationFn: (repairId: string) =>
            apiClient.post(`/repairs/accept/${repairId}`, { estimatedCost: 100, estimatedTime: '1 hour' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deliveryAssignments'] });
            alert('Delivery booking accepted at standard $100 fee!');
        }
    });

    if (user?.role !== 'delivery') return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/30">
            <div className="text-6xl mb-4">🚚</div>
            <p className="text-xl font-black uppercase tracking-widest">Delivery Access Required</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            <section className="glass-card rounded-[2rem] p-10 border border-white/10 shadow-premium relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                            Delivery <span className="text-accent">Portal</span>
                        </h1>
                        <p className="text-white/60 text-xl font-medium">Safe travels, {user?.name || user?.email?.split('@')[0]}. Route mapping active.</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setActiveTab('assignments')}
                            className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-premium ${activeTab === 'assignments' ? 'vibrant-gradient text-white border-transparent' : 'glass-card text-white/40 border-white/5'}`}
                        >📦 Assignments</button>
                        <button onClick={() => setActiveTab('marketplace')}
                            className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-premium ${activeTab === 'marketplace' ? 'vibrant-gradient text-white border-transparent' : 'glass-card text-white/40 border-white/5'}`}
                        > 🛒 Marketplace</button>
                    </div>
                </div>
            </section>

            {activeTab === 'assignments' && (
                <section className="space-y-8 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase">Active Deliveries</h2>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-accent/50 to-transparent"></div>
                    </div>

                    {assignments?.length === 0 ? (
                        <div className="glass-card p-20 rounded-[3rem] border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-white/10">
                            <div className="text-6xl mb-6">📭</div>
                            <p className="font-bold uppercase tracking-[0.2em]">No active assignments</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {assignments?.map((repair: any) => (
                                <div key={repair.id} className="glass-card p-8 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-accent/30 transition-premium">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-3xl">📦</div>
                                        <div>
                                            <h4 className="text-white font-bold text-xl mb-1">{repair.device_type} <span className="text-white/40 text-sm">{repair.device_model}</span></h4>
                                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-none mb-3">
                                                {repair.id} • <span className="text-accent">{repair.status}</span>
                                            </p>
                                            <p className="text-white/60 text-sm">📍 {repair.delivery ? 'Doorstep Delivery' : 'Shop Pickup/Delivery'}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 items-end">
                                        {repair.status === 'pending' || repair.status === 'assigned' ? (
                                            <div className="text-right">
                                                <p className="text-[8px] font-black uppercase text-accent mb-2">Standard Fee: $100.00</p>
                                                <button
                                                    onClick={() => acceptDeliveryMutation.mutate(repair.id)}
                                                    className="vibrant-gradient text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-accent/40 transition-premium"
                                                >Confirm Delivery</button>
                                            </div>
                                        ) : (
                                            <div className="text-right">
                                                <p className="text-brand font-black text-xl">$100.00</p>
                                                <button className="glass-card px-8 py-3 rounded-xl text-white/40 font-bold text-[10px] uppercase tracking-widest hover:text-white transition-premium border border-white/5 mt-2">Update Status</button>
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
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-3xl font-black text-white tracking-widest uppercase">Quick Sell</h2>
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-brand/50 to-transparent"></div>
                    </div>

                    <div className="glass-card p-12 rounded-[2.5rem] border border-white/10 text-center max-w-2xl mx-auto">
                        <div className="text-6xl mb-6">🤝</div>
                        <h3 className="text-2xl font-black text-white mb-4">Have spare devices?</h3>
                        <p className="text-white/40 mb-8 leading-relaxed font-medium">As a delivery partner, you're always on the move. Post any devices you've collected or want to sell directly to the trust-based community marketplace.</p>
                        <Link
                            to="/marketplace"
                            className="inline-block vibrant-gradient text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest hover:shadow-2xl hover:scale-105 transition-premium"
                        >🚀 Go to Marketplace Form</Link>
                    </div>
                </section>
            )}
        </div>
    );
};

export default DeliveryPersonneldashboard;
