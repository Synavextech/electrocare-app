import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';
import useAuth from '../hooks/useAuth';

const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'shops' | 'technicians' | 'delivery' | 'approvals' | 'notifications' | 'inquiries'>('analytics');

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

  const { data: roleApplications } = useQuery({
    queryKey: ['admin-role-applications'],
    queryFn: () => apiClient.get('/admin/role-applications').then((res) => res.data),
    enabled: activeTab === 'approvals',
  });

  const { data: withdrawalRequests } = useQuery({
    queryKey: ['admin-withdrawal-requests'],
    queryFn: () => apiClient.get('/admin/withdrawal-requests').then((res) => res.data),
    enabled: activeTab === 'approvals',
  });

  const { data: shops } = useQuery({
    queryKey: ['shops-all'],
    queryFn: () => apiClient.get('/shops').then((res) => res.data),
    enabled: activeTab === 'shops' || activeTab === 'technicians' || activeTab === 'delivery',
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

  const { data: serviceInquiries, isLoading: inquiriesLoading } = useQuery({
    queryKey: ['admin-service-inquiries'],
    queryFn: () => apiClient.get('/service-inquiries').then((res) => res.data),
    enabled: activeTab === 'inquiries',
  });

  const updateInquiryStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      apiClient.patch(`/service-inquiries/${id}`, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-service-inquiries'] });
      alert('Service inquiry status updated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to update inquiry status');
    }
  });

  const approveSaleMutation = useMutation({
    mutationFn: ({ saleId, points, cash }: { saleId: string, points?: number, cash?: number }) =>
      apiClient.post('/admin/approve-sale', { saleId, points, cash }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-sales'] });
      alert('Sale approved successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Approval failed');
    }
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
      alert('Purchase approved! Device listing has been marked as sold and removed from marketplace.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Purchase approval failed');
    }
  });

  const destroySaleMutation = useMutation({
    mutationFn: (saleId: string) => apiClient.delete(`/marketplace/${saleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-purchase-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-sales'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      alert('Listing permanently destroyed from database and marketplace.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to destroy listing');
    }
  });

  const approveWithdrawalMutation = useMutation({
    mutationFn: (data: { userId: string; amount: number; phone: string }) =>
      apiClient.post('/admin/approve-withdrawal', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawal-requests'] });
      alert('Withdrawal approved and processed via M-Pesa!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Withdrawal approval failed');
    }
  });

  const approveRoleApplicationMutation = useMutation({
    mutationFn: (applicationId: string) => apiClient.post('/admin/approve-role-application', { applicationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-role-applications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('Role application approved!');
    },
  });

  const rejectRoleApplicationMutation = useMutation({
    mutationFn: ({ applicationId, reason }: { applicationId: string, reason: string }) =>
      apiClient.post('/admin/reject-role-application', { applicationId, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-role-applications'] });
      alert('Role application rejected');
    },
  });

  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [awardType, setAwardType] = useState<{ [key: string]: 'points' | 'cash' }>({});
  const [awardAmount, setAwardAmount] = useState<{ [key: string]: number }>({});

  const [broadcast, setBroadcast] = useState({ subject: '', message: '' });
  const [selectedGalleryListing, setSelectedGalleryListing] = useState<any | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  const sendNotificationMutation = useMutation({
    mutationFn: (data: { subject: string, message: string }) =>
      apiClient.post('/notifications/broadcast', data),
    onSuccess: () => {
      alert('Broadcast sent!');
      setBroadcast({ subject: '', message: '' });
    },
  });

  // Shop configuration state
  const [selectedShopToConfig, setSelectedShopToConfig] = useState<any | null>(null);
  const [shopConfigStatus, setShopConfigStatus] = useState<string>('active');
  const [shopConfigCustomStatus, setShopConfigCustomStatus] = useState<string>('');
  const [shopConfigStatusNote, setShopConfigStatusNote] = useState<string>('');
  const [shopConfigServices, setShopConfigServices] = useState<string>('');
  const [shopConfigName, setShopConfigName] = useState<string>('');
  const [shopConfigAddress, setShopConfigAddress] = useState<string>('');
  const [shopConfigCounty, setShopConfigCounty] = useState<string>('');

  const updateShopConfigMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      status: string;
      statusNote?: string | null;
      name?: string;
      address?: string;
      county?: string;
      services?: string[];
    }) => {
      await apiClient.patch(`/shops/${payload.id}/status`, {
        status: payload.status,
        statusNote: payload.statusNote || null,
      });
      await apiClient.patch(`/shops/${payload.id}`, {
        name: payload.name,
        address: payload.address,
        county: payload.county,
        services: payload.services,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shops-all'] });
      queryClient.invalidateQueries({ queryKey: ['shops'] });
      setSelectedShopToConfig(null);
      alert('Shop configuration updated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to update shop configuration');
    },
  });

  const handleOpenShopConfig = (shop: any) => {
    setSelectedShopToConfig(shop);
    const rawStatus = (shop.status || 'active').toLowerCase();
    const isStandard = ['active', 'closed', 'suspended', 'coming_soon'].includes(rawStatus);
    if (isStandard) {
      setShopConfigStatus(rawStatus);
      setShopConfigCustomStatus('');
    } else {
      setShopConfigStatus('custom');
      setShopConfigCustomStatus(shop.status || '');
    }
    setShopConfigStatusNote(shop.statusNote || '');
    setShopConfigName(shop.name || '');
    setShopConfigAddress(shop.address || shop.location || '');
    setShopConfigCounty(shop.county || '');
    setShopConfigServices(Array.isArray(shop.services) ? shop.services.join(', ') : '');
  };

  const handleSaveShopConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShopToConfig) return;

    let finalStatus = shopConfigStatus;
    if (shopConfigStatus === 'custom') {
      if (!shopConfigCustomStatus.trim()) {
        alert('Please enter a custom status label');
        return;
      }
      finalStatus = shopConfigCustomStatus.trim();
    }

    const servicesArray = shopConfigServices
      ? shopConfigServices.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    updateShopConfigMutation.mutate({
      id: selectedShopToConfig.id,
      status: finalStatus,
      statusNote: shopConfigStatusNote.trim() || null,
      name: shopConfigName.trim() || selectedShopToConfig.name,
      address: shopConfigAddress.trim() || selectedShopToConfig.address,
      county: shopConfigCounty.trim() || selectedShopToConfig.county,
      services: servicesArray,
    });
  };

  // Technician configuration state
  const [selectedTechToConfig, setSelectedTechToConfig] = useState<any | null>(null);
  const [techConfigStatus, setTechConfigStatus] = useState<string>('active');
  const [techConfigCustomStatus, setTechConfigCustomStatus] = useState<string>('');
  const [techConfigStatusNote, setTechConfigStatusNote] = useState<string>('');
  const [techConfigName, setTechConfigName] = useState<string>('');
  const [techConfigPhone, setTechConfigPhone] = useState<string>('');
  const [techConfigCategory, setTechConfigCategory] = useState<string>('');
  const [techConfigSubCategory, setTechConfigSubCategory] = useState<string>('');
  const [techConfigShopId, setTechConfigShopId] = useState<string>('');
  const [techConfigDescription, setTechConfigDescription] = useState<string>('');

  const updateTechConfigMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      status: string;
      statusNote?: string | null;
      name?: string;
      phone?: string | null;
      category?: string | null;
      subCategory?: string | null;
      shopId?: string | null;
      description?: string | null;
    }) => {
      await apiClient.patch(`/technician/${payload.id}/status`, {
        status: payload.status,
        statusNote: payload.statusNote || null,
      });
      await apiClient.patch(`/technician/${payload.id}`, {
        name: payload.name,
        phone: payload.phone,
        category: payload.category,
        subCategory: payload.subCategory,
        shopId: payload.shopId || null,
        description: payload.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians-all'] });
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setSelectedTechToConfig(null);
      alert('Technician configuration updated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to update technician configuration');
    },
  });

  const handleOpenTechConfig = (tech: any) => {
    setSelectedTechToConfig(tech);
    const rawStatus = (tech.status || 'active').toLowerCase();
    const isStandard = ['active', 'inactive', 'on_leave', 'suspended'].includes(rawStatus);
    if (isStandard) {
      setTechConfigStatus(rawStatus);
      setTechConfigCustomStatus('');
    } else {
      setTechConfigStatus('custom');
      setTechConfigCustomStatus(tech.status || '');
    }
    setTechConfigStatusNote(tech.statusNote || '');
    setTechConfigName(tech.name || '');
    setTechConfigPhone(tech.phone || '');
    setTechConfigCategory(tech.category || '');
    setTechConfigSubCategory(tech.subCategory || '');
    setTechConfigShopId(tech.shopId || '');
    setTechConfigDescription(tech.description || '');
  };

  const handleSaveTechConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechToConfig) return;

    let finalStatus = techConfigStatus;
    if (techConfigStatus === 'custom') {
      if (!techConfigCustomStatus.trim()) {
        alert('Please enter a custom status label');
        return;
      }
      finalStatus = techConfigCustomStatus.trim();
    }

    updateTechConfigMutation.mutate({
      id: selectedTechToConfig.id,
      status: finalStatus,
      statusNote: techConfigStatusNote.trim() || null,
      name: techConfigName.trim() || selectedTechToConfig.name,
      phone: techConfigPhone.trim() || null,
      category: techConfigCategory.trim() || null,
      subCategory: techConfigSubCategory.trim() || null,
      shopId: techConfigShopId || null,
      description: techConfigDescription.trim() || null,
    });
  };

  // Delivery configuration state
  const [selectedDeliveryToConfig, setSelectedDeliveryToConfig] = useState<any | null>(null);
  const [deliveryConfigStatus, setDeliveryConfigStatus] = useState<string>('active');
  const [deliveryConfigCustomStatus, setDeliveryConfigCustomStatus] = useState<string>('');
  const [deliveryConfigStatusNote, setDeliveryConfigStatusNote] = useState<string>('');
  const [deliveryConfigName, setDeliveryConfigName] = useState<string>('');
  const [deliveryConfigPhone, setDeliveryConfigPhone] = useState<string>('');
  const [deliveryConfigType, setDeliveryConfigType] = useState<string>('RealTime');
  const [deliveryConfigRegion, setDeliveryConfigRegion] = useState<string>('');
  const [deliveryConfigShopId, setDeliveryConfigShopId] = useState<string>('');

  const updateDeliveryConfigMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      status: string;
      statusNote?: string | null;
      name?: string;
      phone?: string | null;
      type?: string;
      region?: string | null;
      shopId?: string | null;
    }) => {
      await apiClient.patch(`/delivery-personnel/${payload.id}/status`, {
        status: payload.status,
        statusNote: payload.statusNote || null,
      });
      await apiClient.patch(`/delivery-personnel/${payload.id}`, {
        name: payload.name,
        phone: payload.phone,
        type: payload.type,
        region: payload.region,
        shopId: payload.shopId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-personnel-all'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryPersonnel'] });
      setSelectedDeliveryToConfig(null);
      alert('Delivery courier configuration updated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to update delivery courier configuration');
    },
  });

  const handleOpenDeliveryConfig = (dp: any) => {
    setSelectedDeliveryToConfig(dp);
    const rawStatus = (dp.status || 'active').toLowerCase();
    const isStandard = ['active', 'offline', 'suspended', 'inactive'].includes(rawStatus);
    if (isStandard) {
      setDeliveryConfigStatus(rawStatus);
      setDeliveryConfigCustomStatus('');
    } else {
      setDeliveryConfigStatus('custom');
      setDeliveryConfigCustomStatus(dp.status || '');
    }
    setDeliveryConfigStatusNote(dp.statusNote || '');
    setDeliveryConfigName(dp.name || '');
    setDeliveryConfigPhone(dp.phone || '');
    setDeliveryConfigType(dp.type || 'RealTime');
    setDeliveryConfigRegion(dp.region || '');
    setDeliveryConfigShopId(dp.shopId || '');
  };

  const handleSaveDeliveryConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeliveryToConfig) return;

    let finalStatus = deliveryConfigStatus;
    if (deliveryConfigStatus === 'custom') {
      if (!deliveryConfigCustomStatus.trim()) {
        alert('Please enter a custom status label');
        return;
      }
      finalStatus = deliveryConfigCustomStatus.trim();
    }

    updateDeliveryConfigMutation.mutate({
      id: selectedDeliveryToConfig.id,
      status: finalStatus,
      statusNote: deliveryConfigStatusNote.trim() || null,
      name: deliveryConfigName.trim() || selectedDeliveryToConfig.name,
      phone: deliveryConfigPhone.trim() || null,
      type: deliveryConfigType,
      region: deliveryConfigRegion.trim() || null,
      shopId: deliveryConfigShopId || null,
    });
  };

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'shops', label: 'Shops', icon: '🏬' },
    { id: 'technicians', label: 'Technicians', icon: '👨‍🔧' },
    { id: 'delivery', label: 'Delivery', icon: '🚚' },
    { id: 'approvals', label: 'Approvals', icon: '✅' },
    { id: 'inquiries', label: 'Inquiries', icon: '⚡' },
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
                { label: 'Platform Revenue', value: 'KES 1,245,000.00', icon: '📈', color: 'brand' },
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
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Balance: KES {Number(u.wallet?.balance || 0).toLocaleString()}</p>
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
                                className="min-w-[120px] h-24 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 cursor-pointer hover:border-brand transition-premium snap-start"
                              >
                                <img src={url} alt="Device" className="w-full h-full object-cover" />
                              </div>
                            ))
                          ) : (
                            <div className="w-24 h-24 rounded-xl bg-white/5 flex items-center justify-center text-4xl">📱</div>
                          )}
                        </div>
                        {sale.imageUrls && sale.imageUrls.length > 3 && (
                          <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-canvas/80 to-transparent pointer-events-none flex items-center justify-end pr-2 text-[10px] font-black text-brand uppercase tracking-widest">
                            More →
                          </div>
                        )}
                        <span className={`absolute -top-3 right-0 glass-card px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sale.condition === 'Unusable' ? 'bg-accent/20 text-accent' : 'bg-brand/20 text-brand'}`}>
                          {sale.condition === 'Unusable' ? 'DEAD PHONE' : sale.condition}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{sale.device}</h3>
                      <p className="text-white/40 text-sm mb-6 leading-relaxed">Seller: <span className="text-white">{sale.user?.name}</span><br />{sale.description}</p>

                      <div className="space-y-4 pt-6 border-t border-white/5">
                        <div className="flex flex-col gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center justify-between gap-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Award Type</label>
                            <div className="flex gap-2">
                              {(['points', 'cash'] as const).map((type) => (
                                <button
                                  key={type}
                                  onClick={() => setAwardType({ ...awardType, [sale.id]: type })}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-premium ${(awardType[sale.id] || 'points') === type
                                      ? 'vibrant-gradient text-white shadow-lg'
                                      : 'bg-white/5 text-white/40 border border-white/5'
                                    }`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Amount</label>
                            <input
                              type="number"
                              value={awardAmount[sale.id] || (awardType[sale.id] === 'cash' ? Math.floor(sale.price * 0.1) : 50)}
                              onChange={(e) => setAwardAmount({ ...awardAmount, [sale.id]: Number(e.target.value) })}
                              className="w-24 bg-white/10 border border-white/10 rounded-lg px-2 py-1 text-xs text-brand font-bold focus:ring-1 focus:ring-brand outline-none"
                            />
                          </div>
                        </div>

                        <textarea
                          placeholder="Rejection reason (if rejecting)..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:ring-1 focus:ring-brand"
                          value={rejectionReason[sale.id] || ''}
                          onChange={(e) => setRejectionReason({ ...rejectionReason, [sale.id]: e.target.value })}
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-black text-white">KES {Number(sale.price || 0).toLocaleString()}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const type = awardType[sale.id] || 'points';
                                const amount = awardAmount[sale.id] || (type === 'cash' ? Math.floor(sale.price * 0.1) : 50);
                                approveSaleMutation.mutate({
                                  saleId: sale.id,
                                  points: type === 'points' ? amount : undefined,
                                  cash: type === 'cash' ? amount : undefined
                                });
                              }}
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

              <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-8">Role Applications</h2>
              {roleApplications?.length === 0 ? (
                <div className="glass-card p-20 rounded-[2.5rem] border border-dashed border-white/5 flex flex-col items-center justify-center text-white/10 mb-12">
                  <div className="text-5xl mb-4">👨‍🔧</div>
                  <p className="font-bold uppercase tracking-widest">No pending applications</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 mb-12">
                  {roleApplications?.map((app: any) => (
                    <div key={app.id} className="glass-card p-8 rounded-[2rem] border border-white/5 hover:border-brand/30 transition-premium shadow-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="text-4xl bg-white/5 p-4 rounded-2xl">
                            {app.requestedRole === 'technician' ? '👨‍🔧' : '🚚'}
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white">{app.user?.name} <span className="text-brand/60 ml-2 text-sm">{app.phone}</span></h4>
                            <p className="text-white/40 text-xs font-black uppercase tracking-widest">
                              Applying for: <span className="text-brand">{app.requestedRole}</span>
                              {app.locality && <span className="ml-3 text-cyan-300">📍 {app.locality}</span>}
                              {app.shop && <span className="ml-3">Shop: <span className="text-white">{app.shop.name}</span></span>}
                            </p>
                            
                            {/* Role-specific details */}
                            {app.requestedRole === 'technician' && (
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {app.experienceLevel && (
                                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                    🎓 {app.experienceLevel.replace(/_/g, ' ')}
                                  </span>
                                )}
                                {Array.isArray(app.proficiency) && app.proficiency.map((p: string, idx: number) => (
                                  <span key={idx} className="px-2 py-0.5 rounded-lg bg-brand/10 text-brand border border-brand/20 text-[10px] font-bold">
                                    ⚡ {p.replace(/_/g, ' ')}
                                  </span>
                                ))}
                                {Array.isArray(app.preferredDevices) && app.preferredDevices.length > 0 && (
                                  <span className="px-2 py-0.5 rounded-lg bg-white/5 text-white/70 border border-white/10 text-[10px] font-medium">
                                    📱 {app.preferredDevices.join(', ')}
                                  </span>
                                )}
                              </div>
                            )}

                            {app.requestedRole === 'delivery' && (
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {app.vehicleType && (
                                  <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-bold">
                                    🚗 {app.vehicleType === 'motorbike' ? '🏍️ Motorbike' : '🚗 Car'}
                                  </span>
                                )}
                                {app.deliveryFrequency && (
                                  <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                                    ⏱️ {app.deliveryFrequency === 'on_call' ? 'On-Call' : '24hr One-Time'}
                                  </span>
                                )}
                              </div>
                            )}

                            <p className="text-white/40 text-[10px] mt-2 italic">"{app.notes || 'No notes provided'}"</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center">
                          {app.documents?.length > 0 && (
                            <div className="flex gap-2 mr-4">
                              {['CV', 'ID', 'Cert'].map((label, i) => (
                                app.documents[i] && (
                                  <a key={i} href={app.documents[i]} target="_blank" rel="noreferrer" className="glass-card px-3 py-1 text-[10px] font-bold text-brand hover:text-white transition-premium">
                                    {label}
                                  </a>
                                )
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => approveRoleApplicationMutation.mutate(app.id)}
                            className="vibrant-gradient text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-xl transition-premium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason) rejectRoleApplicationMutation.mutate({ applicationId: app.id, reason });
                            }}
                            className="glass-card text-white/40 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest border border-white/5 hover:text-red-500 transition-premium"
                          >
                            Reject
                          </button>
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
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xl font-black text-white">KES {req.price}</span>
                        <button
                          onClick={() => approvePurchaseMutation.mutate(req.id)}
                          disabled={approvePurchaseMutation.isPending}
                          className="premium-brand-gradient text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs hover:shadow-xl transition-premium cursor-pointer disabled:opacity-50"
                        >
                          Approve & Mark Sold
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Permanently destroy and delete listing "${req.sale?.device || 'item'}" from marketplace and database?`)) {
                              destroySaleMutation.mutate(req.saleId);
                            }
                          }}
                          disabled={destroySaleMutation.isPending}
                          className="glass-card text-rose-400 hover:text-rose-300 border border-rose-500/20 px-4 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-rose-500/10 transition-premium cursor-pointer"
                        >
                          <span>🗑️</span> Destroy Listing
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Withdrawal Requests Section */}
              <div className="mt-12">
                <h2 className="text-3xl font-black text-white tracking-widest uppercase mb-8">Withdrawal Requests</h2>
                {withdrawalRequests?.length === 0 ? (
                  <div className="glass-card p-16 rounded-[2.5rem] border border-dashed border-white/5 flex flex-col items-center justify-center text-white/10">
                    <div className="text-5xl mb-4">💰</div>
                    <p className="font-bold uppercase tracking-widest">No pending withdrawals</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {withdrawalRequests?.map((tx: any) => (
                      <div key={tx.id} className="glass-card p-6 rounded-2xl border border-white/5 flex items-center justify-between hover:border-brand/30 transition-premium">
                        <div className="flex items-center gap-6">
                          <div className="text-3xl">📤</div>
                          <div>
                            <h4 className="text-white font-bold">{tx.wallet?.User?.name || 'User Withdrawal'}</h4>
                            <p className="text-white/40 text-xs font-black uppercase tracking-widest">
                              Phone: {tx.wallet?.User?.phone || 'Not provided'} • User ID: {tx.wallet?.User?.id?.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xl font-black text-white">KES {Number(tx.amount).toLocaleString()}</span>
                          <button
                            onClick={() => {
                              const phone = tx.wallet?.User?.phone || prompt('Enter recipient M-Pesa phone:');
                              if (phone) {
                                approveWithdrawalMutation.mutate({
                                  userId: tx.wallet?.User?.id,
                                  amount: Number(tx.amount),
                                  phone
                                });
                              }
                            }}
                            disabled={approveWithdrawalMutation.isPending}
                            className="premium-brand-gradient text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs hover:shadow-xl transition-premium cursor-pointer disabled:opacity-50"
                          >
                            Approve & Pay M-Pesa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'shops' && (
          <section className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-3xl font-black text-white tracking-widest uppercase">Shop Management & Controls</h2>
                <p className="text-white/50 text-xs mt-1">Configure status, operational notices, and service capabilities for registered repair centers.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="glass-card px-4 py-2 rounded-xl text-xs font-black text-brand border border-brand/20">
                  🏬 {shops?.length || 0} Registered Locations
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {shops?.map((shop: any) => {
                const rawStatus = (shop.status || 'active').toLowerCase();
                const isCustom = !['active', 'closed', 'suspended', 'coming_soon'].includes(rawStatus);

                return (
                  <div
                    key={shop.id}
                    className={`glass-card p-8 rounded-[2rem] border transition-premium relative overflow-hidden flex flex-col justify-between ${
                      rawStatus === 'active'
                        ? 'border-white/5 hover:border-emerald-500/40'
                        : rawStatus === 'closed'
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : rawStatus === 'suspended'
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : rawStatus === 'coming_soon'
                        ? 'border-purple-500/30 bg-purple-500/5'
                        : 'border-cyan-500/30 bg-cyan-500/5'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="text-4xl">🏬</div>
                        <div className="flex flex-col items-end gap-1.5">
                          {rawStatus === 'active' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active
                            </span>
                          )}
                          {rawStatus === 'closed' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              🔴 Closed
                            </span>
                          )}
                          {rawStatus === 'suspended' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              ⚠️ Suspended
                            </span>
                          )}
                          {rawStatus === 'coming_soon' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/30">
                              🚀 Coming Soon
                            </span>
                          )}
                          {isCustom && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand/10 text-brand border border-brand/30">
                              🏷️ {shop.status}
                            </span>
                          )}
                          <span className="text-[10px] text-white/40 font-mono font-bold">
                            {shop.shopCode}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-1">{shop.name}</h3>
                      <p className="text-white/40 text-xs mb-4 uppercase tracking-widest font-black flex items-center gap-1.5">
                        <span className="text-brand">📍</span> {shop.location || shop.address} {shop.county ? `(${shop.county})` : ''}
                      </p>

                      {shop.statusNote && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 mb-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-brand mb-0.5">Status Note</p>
                          <p className="text-xs text-white/80 font-medium italic">"{shop.statusNote}"</p>
                        </div>
                      )}

                      {Array.isArray(shop.services) && shop.services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-6">
                          {shop.services.slice(0, 3).map((srv: string, idx: number) => (
                            <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-white/5 text-[9px] font-bold text-white/60 border border-white/5">
                              {srv}
                            </span>
                          ))}
                          {shop.services.length > 3 && (
                            <span className="px-2 py-0.5 rounded-lg bg-white/5 text-[9px] font-bold text-white/40 border border-white/5">
                              +{shop.services.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenShopConfig(shop)}
                      className="w-full vibrant-gradient py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#03131e] border border-white/5 hover:shadow-lg transition-premium cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>⚙️</span> Configure Shop & Status
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'technicians' && (
          <section className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-3xl font-black text-white tracking-widest uppercase">Technician Management & Controls</h2>
                <p className="text-white/50 text-xs mt-1">Configure status, operational notices, and service capabilities for registered specialists.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="glass-card px-4 py-2 rounded-xl text-xs font-black text-brand border border-brand/20">
                  👨‍🔧 {technicians?.length || 0} Registered Specialists
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {technicians?.map((tech: any) => {
                const rawStatus = (tech.status || 'active').toLowerCase();
                const isCustom = !['active', 'inactive', 'on_leave', 'suspended'].includes(rawStatus);

                return (
                  <div
                    key={tech.id}
                    className={`glass-card p-8 rounded-[2rem] border transition-premium relative overflow-hidden flex flex-col justify-between ${
                      rawStatus === 'active'
                        ? 'border-white/5 hover:border-emerald-500/40'
                        : rawStatus === 'on_leave'
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : rawStatus === 'suspended'
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : rawStatus === 'inactive'
                        ? 'border-white/10 bg-white/5'
                        : 'border-cyan-500/30 bg-cyan-500/5'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="text-4xl">👨‍🔧</div>
                        <div className="flex flex-col items-end gap-1.5">
                          {rawStatus === 'active' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active
                            </span>
                          )}
                          {rawStatus === 'on_leave' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              🏖️ On Leave
                            </span>
                          )}
                          {rawStatus === 'suspended' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              ⚠️ Suspended
                            </span>
                          )}
                          {rawStatus === 'inactive' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/50 border border-white/20">
                              ⚪ Inactive
                            </span>
                          )}
                          {isCustom && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand/10 text-brand border border-brand/30">
                              🏷️ {tech.status}
                            </span>
                          )}
                          <span className="text-[10px] text-white/40 font-mono font-bold">
                            ⭐ {tech.rating || '4.8'} ({tech.reviews || 0} reviews)
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-1">{tech.name}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <span className="px-2.5 py-0.5 rounded-lg bg-brand/10 text-[10px] font-black text-brand uppercase tracking-wider border border-brand/20">
                          {tech.category || 'Hardware'}
                        </span>
                        {tech.subCategory && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-white/5 text-[10px] font-bold text-white/60 border border-white/5">
                            {tech.subCategory}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-white/60 mb-4">
                        <p className="flex items-center gap-2">
                          <span className="text-brand">🏬</span>
                          <span>{tech.shop?.name || 'Unassigned Center'} {tech.shop?.county ? `(${tech.shop?.county})` : ''}</span>
                        </p>
                        {tech.phone && (
                          <p className="flex items-center gap-2">
                            <span>📞</span> <span>{tech.phone}</span>
                          </p>
                        )}
                        {tech.email && (
                          <p className="flex items-center gap-2 truncate">
                            <span>✉️</span> <span className="truncate">{tech.email}</span>
                          </p>
                        )}
                      </div>

                      {tech.statusNote && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 mb-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-brand mb-0.5">Status Note</p>
                          <p className="text-xs text-white/80 font-medium italic">"{tech.statusNote}"</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenTechConfig(tech)}
                      className="w-full vibrant-gradient py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#03131e] border border-white/5 hover:shadow-lg transition-premium cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      <span>⚙️</span> Configure Technician & Status
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'delivery' && (
          <section className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div>
                <h2 className="text-3xl font-black text-white tracking-widest uppercase">Delivery Fleet & Couriers</h2>
                <p className="text-white/50 text-xs mt-1">Configure status, dispatch capabilities, service areas, and operational parameters for fleet riders.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="glass-card px-4 py-2 rounded-xl text-xs font-black text-brand border border-brand/20">
                  🚚 {deliveryPersonnel?.length || 0} Registered Couriers
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {deliveryPersonnel?.map((dp: any) => {
                const rawStatus = (dp.status || 'active').toLowerCase();
                const isCustom = !['active', 'offline', 'suspended', 'inactive'].includes(rawStatus);

                return (
                  <div
                    key={dp.id}
                    className={`glass-card p-8 rounded-[2rem] border transition-premium relative overflow-hidden flex flex-col justify-between ${
                      rawStatus === 'active'
                        ? 'border-white/5 hover:border-emerald-500/40'
                        : rawStatus === 'offline'
                        ? 'border-white/10 bg-white/5'
                        : rawStatus === 'suspended'
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : 'border-cyan-500/30 bg-cyan-500/5'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="text-4xl">🚚</div>
                        <div className="flex flex-col items-end gap-1.5">
                          {rawStatus === 'active' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active On Duty
                            </span>
                          )}
                          {rawStatus === 'offline' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-white/50 border border-white/20">
                              ⚪ Offline
                            </span>
                          )}
                          {rawStatus === 'suspended' && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              ⚠️ Suspended
                            </span>
                          )}
                          {isCustom && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand/10 text-brand border border-brand/30">
                              🏷️ {dp.status}
                            </span>
                          )}
                          <span className="text-[10px] text-white/40 font-mono font-bold">
                            ⭐ {dp.rating || '4.9'} • {dp.current_load || 0} active trips
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-1">{dp.name}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                          dp.type === 'RealTime'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        }`}>
                          {dp.type === 'RealTime' ? '⚡ RealTime Express' : '📦 OneTime Scheduled'}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-white/60 mb-4">
                        <p className="flex items-center gap-2">
                          <span className="text-brand">📍</span>
                          <span>Region: {dp.region || 'All Localities'}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-brand">🏬</span>
                          <span>Hub: {dp.shop?.name || 'Central Hub'} {dp.shop?.county ? `(${dp.shop?.county})` : ''}</span>
                        </p>
                        {dp.phone && (
                          <p className="flex items-center gap-2">
                            <span>📞</span> <span>{dp.phone}</span>
                          </p>
                        )}
                        {dp.email && (
                          <p className="flex items-center gap-2 truncate">
                            <span>✉️</span> <span className="truncate">{dp.email}</span>
                          </p>
                        )}
                      </div>

                      {dp.statusNote && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 mb-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-brand mb-0.5">Status Note</p>
                          <p className="text-xs text-white/80 font-medium italic">"{dp.statusNote}"</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenDeliveryConfig(dp)}
                      className="w-full vibrant-gradient py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#03131e] border border-white/5 hover:shadow-lg transition-premium cursor-pointer flex items-center justify-center gap-2 mt-2"
                    >
                      <span>⚙️</span> Configure Courier & Status
                    </button>
                  </div>
                );
              })}
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

        {activeTab === 'inquiries' && (
          <section className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-white tracking-widest uppercase">
                  Service & Infrastructure Inquiries
                </h2>
                <p className="text-white/60 text-xs font-light mt-1">
                  Requests for Custom Software, AI Systems, ISP Management, Electron Network & Satellite Broadband.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-4 py-1.5 rounded-full text-xs font-black bg-brand/10 text-brand border border-brand/20">
                  {serviceInquiries ? serviceInquiries.length : 0} Total Inquiries
                </span>
              </div>
            </div>

            {inquiriesLoading ? (
              <div className="flex justify-center items-center py-20 text-white/40">
                <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mr-3" />
                Loading inquiries...
              </div>
            ) : !serviceInquiries || serviceInquiries.length === 0 ? (
              <div className="glass-card p-12 rounded-[2.5rem] border border-white/10 text-center space-y-3">
                <div className="text-5xl">⚡</div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider">No Inquiries Found</h3>
                <p className="text-white/50 text-xs">New client requests from the landing page will appear here live.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {serviceInquiries.map((inq: any) => {
                  const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
                    software_custom_app: { label: 'Software / App', icon: '💻', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
                    ai_configuration: { label: 'AI Configuration', icon: '🧠', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                    isp_management: { label: 'ISP Management', icon: '📡', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                    electron_network: { label: 'Electron Network', icon: '⚡', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
                    satellite_internet: { label: 'Satellite Broadband', icon: '🛰️', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                  };

                  const cfg = typeLabels[inq.serviceType] || { label: inq.serviceType, icon: '📋', color: 'bg-white/10 text-white/80 border-white/20' };

                  return (
                    <div
                      key={inq.id}
                      className="glass-card p-6 md:p-8 rounded-[2rem] border border-white/10 hover:border-brand/30 transition-premium space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{cfg.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
                                {cfg.label}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                                {inq.targetEntity || 'Business'}
                              </span>
                            </div>
                            <h3 className="text-lg font-black text-white mt-1">
                              {inq.clientName}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-[10px] font-bold text-white/40">
                            {new Date(inq.createdAt).toLocaleDateString()}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                              inq.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : inq.status === 'contacted'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                : inq.status === 'in_progress'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-white/10 text-white/70 border-white/20'
                            }`}
                          >
                            {inq.status || 'pending'}
                          </span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                          <p className="text-[10px] text-white/40 uppercase font-black">Contact Details</p>
                          <p className="text-white font-bold mt-0.5">{inq.clientPhone}</p>
                          <p className="text-white/60 truncate">{inq.clientEmail}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                          <p className="text-[10px] text-white/40 uppercase font-black">Location / Address</p>
                          <p className="text-white font-bold mt-0.5">{inq.locationTown || 'N/A'}</p>
                          <p className="text-white/60 truncate">{inq.locationAddress || 'No physical address noted'}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                          <p className="text-[10px] text-white/40 uppercase font-black">Budget / Quotation</p>
                          <p className="text-brand font-black mt-0.5">
                            {inq.budget || inq.quotationKes
                              ? `KES ${Number(inq.budget || inq.quotationKes).toLocaleString()}`
                              : 'To Be Quoted'}
                          </p>
                          <p className="text-white/50 text-[10px]">Urgency: {inq.urgency || 'medium'}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                          <p className="text-[10px] text-white/40 uppercase font-black">Update Status</p>
                          <select
                            value={inq.status || 'pending'}
                            onChange={(e) =>
                              updateInquiryStatusMutation.mutate({ id: inq.id, status: e.target.value })
                            }
                            className="mt-1 w-full px-2 py-1 bg-surface border border-white/10 rounded-lg text-white text-xs outline-none focus:border-brand"
                          >
                            <option value="pending">Pending Review</option>
                            <option value="contacted">Client Contacted</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Specifications / Notes */}
                      {(inq.notes || (inq.details && Object.keys(inq.details).length > 0)) && (
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-1">
                          <p className="text-[10px] uppercase font-black text-white/40">Specifications & Requirements</p>
                          {inq.notes && <p className="text-white/80">{inq.notes}</p>}
                          {inq.details && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {Object.entries(inq.details).map(([k, v]) =>
                                v ? (
                                  <span key={k} className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-white/70">
                                    <strong className="text-white/90">{k}:</strong> {String(v)}
                                  </span>
                                ) : null
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

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
                <span className="text-xs font-black uppercase tracking-[0.3em] text-brand mb-4 block">Inspection Mode</span>
                <h2 className="text-4xl font-black text-white mb-6 tracking-tighter">{selectedGalleryListing.device}</h2>
                <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Seller</p>
                    <p className="text-white font-bold">{selectedGalleryListing.user?.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Category</p>
                    <p className="text-white font-bold">{selectedGalleryListing.category || 'Standard'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Price</p>
                    <p className="text-brand font-black text-2xl">KES {Number(selectedGalleryListing.price || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop Configuration Modal */}
      {selectedShopToConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-brand/30 shadow-2xl p-6 md:p-10 space-y-6 relative bg-[#0b101b]/95 text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-2xl">
                  🏬
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand font-mono">
                      {selectedShopToConfig.shopCode || 'SHOP'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white">
                    Configure {selectedShopToConfig.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedShopToConfig(null)}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShopConfig} className="space-y-6">
              {/* Status Section */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-white/70 block">
                  Shop Operational Status <span className="text-brand">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'active', label: 'Active', icon: '🟢', desc: 'Accepting repairs & orders' },
                    { id: 'closed', label: 'Closed', icon: '🔴', desc: 'Temporarily closed' },
                    { id: 'suspended', label: 'Suspended', icon: '⚠️', desc: 'Halted / Under review' },
                    { id: 'coming_soon', label: 'Coming Soon', icon: '🚀', desc: 'Pre-launch opening' },
                    { id: 'custom', label: 'Custom Status', icon: '🏷️', desc: 'Custom tag (e.g. Renovating)' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setShopConfigStatus(st.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        shopConfigStatus === st.id
                          ? 'bg-brand/15 border-brand ring-2 ring-brand/30'
                          : 'bg-white/5 border-white/5 hover:border-brand/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{st.icon}</span>
                        <span className="text-xs font-black text-white">{st.label}</span>
                      </div>
                      <p className="text-[10px] text-white/50 font-medium leading-tight">
                        {st.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Status Label Input if selected */}
              {shopConfigStatus === 'custom' && (
                <div className="p-4 rounded-2xl bg-brand/5 border border-brand/20 space-y-2 animate-in fade-in duration-200">
                  <label className="text-xs font-black uppercase tracking-widest text-brand block">
                    Custom Status Label <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={shopConfigCustomStatus}
                    onChange={(e) => setShopConfigCustomStatus(e.target.value)}
                    placeholder="e.g. Under Renovation, Relocating, Holiday Break..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-brand outline-none text-sm font-semibold"
                    required
                  />
                  <p className="text-[10px] text-white/50">
                    This tag will be displayed in the client-facing shop locator and listings.
                  </p>
                </div>
              )}

              {/* Status Note / Public Reason */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/70 block">
                  Public Status Announcement / Reason (Optional)
                </label>
                <textarea
                  value={shopConfigStatusNote}
                  onChange={(e) => setShopConfigStatusNote(e.target.value)}
                  placeholder="e.g. Closed for scheduled electrical maintenance until Friday 10 AM. Drop-offs routed to Westlands branch."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-brand outline-none text-sm resize-none"
                />
              </div>

              {/* Shop Metadata Details */}
              <div className="border-t border-white/10 pt-5 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-brand">
                  Location & Contact Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/70">Shop Name</label>
                    <input
                      type="text"
                      value={shopConfigName}
                      onChange={(e) => setShopConfigName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-brand outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/70">County / Region</label>
                    <input
                      type="text"
                      value={shopConfigCounty}
                      onChange={(e) => setShopConfigCounty(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-brand outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-white/70">Physical Address</label>
                  <input
                    type="text"
                    value={shopConfigAddress}
                    onChange={(e) => setShopConfigAddress(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-brand outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-white/70">
                    Offered Services <span className="text-[10px] text-white/40 font-normal">(Comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={shopConfigServices}
                    onChange={(e) => setShopConfigServices(e.target.value)}
                    placeholder="Screen Repair, Battery Replacement, Logic Board Diagnostics"
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-brand outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedShopToConfig(null)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateShopConfigMutation.isPending}
                  className="premium-gradient text-[#03131e] px-7 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {updateShopConfigMutation.isPending ? 'Saving Updates...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Technician Configuration & Status Modal */}
      {selectedTechToConfig && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#03131e]/85 backdrop-blur-xl"
            onClick={() => setSelectedTechToConfig(null)}
          />
          <div className="relative w-full max-w-2xl glass-card rounded-[2.5rem] border border-white/10 shadow-premium p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-2xl">
                  👨‍🔧
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand font-mono">
                    TECHNICIAN CONTROLS
                  </span>
                  <h3 className="text-2xl font-black text-white">
                    Configure {selectedTechToConfig.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTechToConfig(null)}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTechConfig} className="space-y-6">
              {/* Status Section */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-white/70 block">
                  Technician Duty Status <span className="text-brand">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'active', label: 'Active', icon: '🟢', desc: 'Accepting repairs & assignments' },
                    { id: 'on_leave', label: 'On Leave', icon: '🏖️', desc: 'Temporarily away / on holiday' },
                    { id: 'suspended', label: 'Suspended', icon: '⚠️', desc: 'Halted from assignments' },
                    { id: 'inactive', label: 'Inactive', icon: '⚪', desc: 'Offboarded or standby' },
                    { id: 'custom', label: 'Custom Status', icon: '🏷️', desc: 'Custom tag (e.g. In Training)' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setTechConfigStatus(st.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        techConfigStatus === st.id
                          ? 'bg-brand/15 border-brand ring-2 ring-brand/30'
                          : 'bg-white/5 border-white/5 hover:border-brand/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{st.icon}</span>
                        <span className="text-xs font-black text-white">{st.label}</span>
                      </div>
                      <p className="text-[10px] text-white/50 font-medium leading-tight">
                        {st.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Status Label */}
              {techConfigStatus === 'custom' && (
                <div className="p-4 rounded-2xl bg-brand/5 border border-brand/20 space-y-2 animate-in fade-in duration-200">
                  <label className="text-xs font-black uppercase tracking-widest text-brand block">
                    Custom Status Label <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={techConfigCustomStatus}
                    onChange={(e) => setTechConfigCustomStatus(e.target.value)}
                    placeholder="e.g. Master Training, Branch Assist, Specialized Lab..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-brand outline-none text-sm font-semibold"
                    required
                  />
                </div>
              )}

              {/* Status Note */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/70 block">
                  Public Status Announcement / Reason (Optional)
                </label>
                <textarea
                  value={techConfigStatusNote}
                  onChange={(e) => setTechConfigStatusNote(e.target.value)}
                  placeholder="e.g. Available on afternoon shifts only or returning from training on Thursday."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-brand outline-none text-sm resize-none"
                />
              </div>

              {/* Profile Details */}
              <div className="border-t border-white/10 pt-5 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-brand">
                  Profile & Assignment Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/70">Full Name</label>
                    <input
                      type="text"
                      value={techConfigName}
                      onChange={(e) => setTechConfigName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-brand outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/70">Phone Number</label>
                    <input
                      type="tel"
                      value={techConfigPhone}
                      onChange={(e) => setTechConfigPhone(e.target.value)}
                      placeholder="+254 700 000000"
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-brand outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/70">Category</label>
                    <input
                      type="text"
                      value={techConfigCategory}
                      onChange={(e) => setTechConfigCategory(e.target.value)}
                      placeholder="e.g. Hardware, Software, Micro-soldering"
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-brand outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/70">Sub-Category / Specialty</label>
                    <input
                      type="text"
                      value={techConfigSubCategory}
                      onChange={(e) => setTechConfigSubCategory(e.target.value)}
                      placeholder="e.g. Screen Replacement, Motherboard Diagnostics"
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-brand outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-white/70">Assigned Repair Center (Shop)</label>
                  <select
                    value={techConfigShopId}
                    onChange={(e) => setTechConfigShopId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:border-brand outline-none"
                  >
                    <option value="">-- No Specific Shop / Freelance --</option>
                    {shops?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.county || s.address})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-white/70">Description / Bio Notes</label>
                  <textarea
                    value={techConfigDescription}
                    onChange={(e) => setTechConfigDescription(e.target.value)}
                    placeholder="Short bio, experience highlights, or certifications..."
                    rows={2}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-brand outline-none resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedTechToConfig(null)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateTechConfigMutation.isPending}
                  className="premium-gradient text-[#03131e] px-7 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {updateTechConfigMutation.isPending ? 'Saving Updates...' : 'Save Technician Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Courier Configuration & Status Modal */}
      {selectedDeliveryToConfig && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#03131e]/85 backdrop-blur-xl"
            onClick={() => setSelectedDeliveryToConfig(null)}
          />
          <div className="relative w-full max-w-2xl glass-card rounded-[2.5rem] border border-white/10 shadow-premium p-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-2xl">
                  🚚
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 font-mono">
                    COURIER FLEET CONTROLS
                  </span>
                  <h3 className="text-2xl font-black text-white">
                    Configure {selectedDeliveryToConfig.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeliveryToConfig(null)}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDeliveryConfig} className="space-y-6">
              {/* Status Section */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-white/70 block">
                  Fleet Duty Status <span className="text-cyan-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'active', label: 'Active', icon: '🟢', desc: 'On duty & available for pickups' },
                    { id: 'offline', label: 'Offline', icon: '⚪', desc: 'Off duty / Shift completed' },
                    { id: 'suspended', label: 'Suspended', icon: '⚠️', desc: 'Halted from dispatch' },
                    { id: 'inactive', label: 'Inactive', icon: '🚫', desc: 'Deactivated from fleet' },
                    { id: 'custom', label: 'Custom Status', icon: '🏷️', desc: 'Custom tag (e.g. Bike Repair)' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setDeliveryConfigStatus(st.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        deliveryConfigStatus === st.id
                          ? 'bg-cyan-500/15 border-cyan-400 ring-2 ring-cyan-400/30'
                          : 'bg-white/5 border-white/5 hover:border-cyan-400/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{st.icon}</span>
                        <span className="text-xs font-black text-white">{st.label}</span>
                      </div>
                      <p className="text-[10px] text-white/50 font-medium leading-tight">
                        {st.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Status Label */}
              {deliveryConfigStatus === 'custom' && (
                <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-2 animate-in fade-in duration-200">
                  <label className="text-xs font-black uppercase tracking-widest text-cyan-400 block">
                    Custom Status Label <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={deliveryConfigCustomStatus}
                    onChange={(e) => setDeliveryConfigCustomStatus(e.target.value)}
                    placeholder="e.g. Bike Maintenance, Route Training, Night Shift..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-cyan-400 outline-none text-sm font-semibold"
                    required
                  />
                </div>
              )}

              {/* Status Note */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/70 block">
                  Public Status Announcement / Reason (Optional)
                </label>
                <textarea
                  value={deliveryConfigStatusNote}
                  onChange={(e) => setDeliveryConfigStatusNote(e.target.value)}
                  placeholder="e.g. Operating on Westlands and CBD routes exclusively today."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-cyan-400 outline-none text-sm resize-none"
                />
              </div>

              {/* Profile Details */}
              <div className="border-t border-white/10 pt-5 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400">
                  Courier Profile & Routing Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/70">Courier Name</label>
                    <input
                      type="text"
                      value={deliveryConfigName}
                      onChange={(e) => setDeliveryConfigName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-cyan-400 outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/70">Phone Number</label>
                    <input
                      type="tel"
                      value={deliveryConfigPhone}
                      onChange={(e) => setDeliveryConfigPhone(e.target.value)}
                      placeholder="+254 700 000000"
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/70">Fleet Dispatch Mode</label>
                    <select
                      value={deliveryConfigType}
                      onChange={(e) => setDeliveryConfigType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:border-cyan-400 outline-none"
                    >
                      <option value="RealTime">⚡ RealTime (Express On-Demand)</option>
                      <option value="OneTime">📦 OneTime (Scheduled 24hr Route)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-white/70">Assigned Region / Locality</label>
                    <input
                      type="text"
                      value={deliveryConfigRegion}
                      onChange={(e) => setDeliveryConfigRegion(e.target.value)}
                      placeholder="e.g. Westlands, CBD, Kilimani"
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-white/70">Assigned Hub / Shop</label>
                  <select
                    value={deliveryConfigShopId}
                    onChange={(e) => setDeliveryConfigShopId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:border-cyan-400 outline-none"
                  >
                    <option value="">-- Central Hub / Roaming Fleet --</option>
                    {shops?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.county || s.address})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedDeliveryToConfig(null)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateDeliveryConfigMutation.isPending}
                  className="vibrant-gradient text-white px-7 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {updateDeliveryConfigMutation.isPending ? 'Saving Updates...' : 'Save Courier Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;