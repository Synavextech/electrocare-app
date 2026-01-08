import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';
import useAuth from '../hooks/useAuth';

const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'shops' | 'technicians' | 'delivery' | 'approvals' | 'notifications'>('analytics');

  if (currentUser?.role !== 'admin') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/30">
      <div className="text-6xl mb-4">🛡️</div>
      <p className="text-xl font-black uppercase tracking-widest">Restricted Access</p>
    </div>
  );

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => apiClient.get('/admin/analytics').then((res) => res.data),
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiClient.get('/admin/users').then((res) => res.data),
    enabled: activeTab === 'users',
  });

  const { data: pendingSales } = useQuery({
    queryKey: ['admin-pending-sales'],
    queryFn: () => apiClient.get('/admin/pending-sales').then((res) => res.data),
    enabled: activeTab === 'approvals',
  });

  const { data: purchaseRequests } = useQuery({
    queryKey: ['admin-purchase-requests'],
    queryFn: () => apiClient.get('/admin/purchase-requests').then((res) => res.data),
    enabled: activeTab === 'approvals',
  });

  const { data: shops } = useQuery({
    queryKey: ['shops-all'],
    queryFn: () => apiClient.get('/shops').then((res) => res.data),
    enabled: activeTab === 'shops',
  });

  const { data: technicians } = useQuery({
    queryKey: ['technicians-all'],
    queryFn: () => apiClient.get('/technician').then((res) => res.data),
    enabled: activeTab === 'technicians',
  });

  const { data: deliveryPersonnel } = useQuery({
    queryKey: ['delivery-personnel-all'],
    queryFn: () => apiClient.get('/delivery-personnel').then((res) => res.data),
    enabled: activeTab === 'delivery',
  });

  const approveSaleMutation = useMutation({
    mutationFn: ({ saleId, points }: { saleId: string, points: number }) =>
      apiClient.post('/admin/approve-sale', { saleId, points }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-sales'] });
    },
  });

  const rejectSaleMutation = useMutation({
    mutationFn: ({ saleId, reason }: { saleId: string, reason: string }) =>
      apiClient.post('/admin/reject-sale', { saleId, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-sales'] });
    },
  });

  const approvePurchaseMutation = useMutation({
    mutationFn: (purchaseId: string) => apiClient.post('/admin/approve-purchase', { purchaseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
    },
  });

  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});

  const [broadcast, setBroadcast] = useState({ subject: '', message: '' });

  const sendNotificationMutation = useMutation({
    mutationFn: (data: { subject: string, message: string }) =>
      apiClient.post('/notifications/broadcast', data),
    onSuccess: () => {
      alert('Broadcast sent!');
      setBroadcast({ subject: '', message: '' });
    },
  });

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'shops', label: 'Shops', icon: '🏬' },
    { id: 'technicians', label: 'Technicians', icon: '👨‍🔧' },
    { id: 'delivery', label: 'Delivery', icon: '🚚' },
    { id: 'approvals', label: 'Approvals', icon: '✅' },
    { id: 'notifications', label: 'Messages', icon: '🔔' },
  ];

  if (analyticsLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/30 animate-pulse">
      <div className="text-6xl mb-4">⚙️</div>
      <p className="text-xl font-black uppercase tracking-widest">Initializing System...</p>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Hero Header */}
      <section className="glass-card rounded-[2.5rem] p-12 border border-white/10 shadow-premium relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 blur-[120px] -mr-48 -mt-48 transition-premium"></div>
        <div className="relative z-10">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-brand mb-4 block">System Command</span>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter">Admin <span className="text-brand">Console.</span></h1>
          <div className="flex flex-wrap gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-premium border font-bold text-xs uppercase tracking-widest ${activeTab === tab.id
                  ? 'vibrant-gradient text-white border-transparent shadow-lg'
                  : 'glass-card text-white/40 border-white/5 hover:border-white/20'
                  }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
        {activeTab === 'analytics' && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Total Users', value: analytics?.users || 0, icon: '👥', color: 'brand' },
                { label: 'Active Repairs', value: analytics?.repairs || 0, icon: '🔧', color: 'accent' },
                { label: 'Platform Revenue', value: '$ 12,450.00', icon: '📈', color: 'brand' },
              ].map((stat, i) => (
                <div key={i} className="glass-card p-10 rounded-[2.5rem] border border-white/5 hover:border-white/20 transition-premium group">
                  <div className="text-4xl mb-6 transform group-hover:scale-110 transition-premium">{stat.icon}</div>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-4xl font-black text-white tracking-tight">{stat.value}</p>
                </div>
              ))}
            </section>
          </>
        )}

        {activeTab === 'users' && (
          <section className="space-y-6">
            <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-8">User Management</h2>
            <div className="grid grid-cols-1 gap-4">
              {users?.map((u: any) => (
                <div key={u.id} className="glass-card p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-brand/30 transition-premium">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-xl">👤</div>
                    <div>
                      <h4 className="text-white font-bold text-lg">{u.name}</h4>
                      <p className="text-white/40 text-xs font-black tracking-widest uppercase">{u.role} • {u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-brand font-black text-sm">{u.wallet?.points || 0} pts</p>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Balance: ${u.wallet?.balance || 0}</p>
                    </div>
                    <button className="glass-card px-4 py-2 rounded-xl text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white border border-white/5 transition-premium">Manage</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'approvals' && (
          <section className="space-y-12">
            <div>
              <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-8">Pending Listings</h2>
              {pendingSales?.length === 0 ? (
                <div className="glass-card p-10 rounded-[2.5rem] border border-dashed border-white/5 flex flex-col items-center justify-center text-white/10 mb-12">
                  <p className="font-bold uppercase tracking-widest">No pending listings</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  {pendingSales?.map((sale: any) => (
                    <div key={sale.id} className="glass-card p-8 rounded-[2rem] border border-white/5 hover:border-brand/30 transition-premium shadow-lg group">
                      <div className="flex justify-between items-start mb-6">
                        {sale.imageUrls && sale.imageUrls[0] ? (
                          <img src={sale.imageUrls[0]} alt="Device" className="w-16 h-16 rounded-xl object-cover" />
                        ) : (
                          <div className="text-4xl">📱</div>
                        )}
                        <span className={`glass-card px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sale.condition === 'Unusable' ? 'bg-accent/20 text-accent' : 'bg-brand/20 text-brand'}`}>
                          {sale.condition === 'Unusable' ? 'DEAD PHONE' : sale.condition}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{sale.device}</h3>
                      <p className="text-white/40 text-sm mb-6 leading-relaxed">Seller: <span className="text-white">{sale.user?.name}</span><br />{sale.description}</p>

                      <div className="space-y-4 pt-6 border-t border-white/5">
                        <textarea
                          placeholder="Rejection reason (if rejecting)..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:ring-1 focus:ring-brand"
                          value={rejectionReason[sale.id] || ''}
                          onChange={(e) => setRejectionReason({ ...rejectionReason, [sale.id]: e.target.value })}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-black text-white">${sale.price}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveSaleMutation.mutate({ saleId: sale.id, points: 50 })}
                              className="vibrant-gradient text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-premium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectSaleMutation.mutate({ saleId: sale.id, reason: rejectionReason[sale.id] || 'Quality check failed' })}
                              className="glass-card text-white/40 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 hover:text-red-500 transition-premium"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-8">Purchase Requests</h2>
              {purchaseRequests?.length === 0 ? (
                <div className="glass-card p-20 rounded-[2.5rem] border border-dashed border-white/5 flex flex-col items-center justify-center text-white/10">
                  <div className="text-5xl mb-4">🛒</div>
                  <p className="font-bold uppercase tracking-widest">No pending purchases</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {purchaseRequests?.map((req: any) => (
                    <div key={req.id} className="glass-card p-6 rounded-2xl border border-white/5 flex items-center justify-between hover:border-brand/30 transition-premium">
                      <div className="flex items-center gap-6">
                        <div className="text-3xl">🛍️</div>
                        <div>
                          <h4 className="text-white font-bold">{req.sale?.device || 'Unknown Device'}</h4>
                          <p className="text-white/40 text-xs font-black uppercase tracking-widest">
                            Buyer: {req.buyer?.name} • Seller: {req.sale?.user?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-xl font-black text-white">${req.price}</span>
                        <button
                          onClick={() => approvePurchaseMutation.mutate(req.id)}
                          className="premium-brand-gradient text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:shadow-xl transition-premium"
                        >
                          Approve Purchase
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'shops' && (
          <section className="space-y-8">
            <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-8">Shop Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {shops?.map((shop: any) => (
                <div key={shop.id} className="glass-card p-8 rounded-[2rem] border border-white/5">
                  <div className="text-4xl mb-4">🏬</div>
                  <h3 className="text-xl font-bold text-white mb-2">{shop.name}</h3>
                  <p className="text-white/40 text-xs mb-6 uppercase tracking-widest font-black">{shop.location || shop.address}</p>
                  <button
                    onClick={() => alert(`Configuring ${shop.name}... Form implementation pending.`)}
                    className="w-full vibrant-gradient py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/5 hover:shadow-lg transition-premium"
                  >
                    Configure shop
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'technicians' && (
          <section className="space-y-8">
            <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-8">Technicians</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {technicians?.map((tech: any) => (
                <div key={tech.id} className="glass-card p-8 rounded-[2rem] border border-white/5">
                  <div className="text-4xl mb-4">👨‍🔧</div>
                  <h3 className="text-xl font-bold text-white mb-2">{tech.name}</h3>
                  <p className="text-white/40 text-xs mb-6 uppercase tracking-widest font-black">{tech.specialty || 'Generalist'}</p>
                  <button className="w-full glass-card py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/5 hover:text-brand transition-premium">Stats</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'delivery' && (
          <section className="space-y-8">
            <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-8">Delivery Fleet</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {deliveryPersonnel?.map((dp: any) => (
                <div key={dp.id} className="glass-card p-8 rounded-[2rem] border border-white/5">
                  <div className="text-4xl mb-4">🚚</div>
                  <h3 className="text-xl font-bold text-white mb-2">{dp.name}</h3>
                  <p className="text-white/40 text-xs mb-6 uppercase tracking-widest font-black">{dp.region} • {dp.type}</p>
                  <button className="w-full glass-card py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/5 hover:text-brand transition-premium">Track Fleet</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'notifications' && (
          <section className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-8 text-center">Broadcast Center</h2>
            <div className="glass-card p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Subject</label>
                  <input
                    type="text"
                    value={broadcast.subject}
                    onChange={(e) => setBroadcast({ ...broadcast, subject: e.target.value })}
                    placeholder="e.g. System Maintenance"
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none transition-premium text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Message Body</label>
                  <textarea
                    value={broadcast.message}
                    onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                    placeholder="Write your announcement..."
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none transition-premium text-white h-40 resize-none"
                  />
                </div>
                <button
                  onClick={() => sendNotificationMutation.mutate(broadcast)}
                  disabled={sendNotificationMutation.isPending || !broadcast.subject || !broadcast.message}
                  className="w-full vibrant-gradient text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-premium shadow-xl disabled:opacity-50"
                >
                  {sendNotificationMutation.isPending ? 'Sending...' : '📢 Send Broadcast'}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;