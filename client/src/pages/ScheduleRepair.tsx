import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import apiClient from '../utils/apiClient';
import { AxiosResponse } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { repairSchema } from '../utils/validators';
import GoogleMapView from '../components/GoogleMapView';
import useAuth from '../hooks/useAuth';

const ScheduleRepair: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<'shop' | 'technician' | 'delivery-select' | 'details'>('shop');
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);
  const [selectedDP, setSelectedDP] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [radiusFilter, setRadiusFilter] = useState<string>('all');
  const [mapModalShop, setMapModalShop] = useState<any>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Could not retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow access to find closest centers.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is currently unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        setLocationError(msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(repairSchema),
    defaultValues: {
      device_type: '',
      device_model: '',
      issue: '',
      delivery: false,
      paymentMethod: 'cod'
    }
  });

  const selectedDeviceType = watch('device_type');
  const selectedDeviceModel = watch('device_model');
  const delivery = watch('delivery');

  const [categorySelection, setCategorySelection] = useState<'Phone' | 'Computer / Laptop' | 'Other' | ''>('');
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [manualModelInput, setManualModelInput] = useState('');
  const [selectedDamagePresets, setSelectedDamagePresets] = useState<string[]>([]);
  const [issueNotes, setIssueNotes] = useState('');

  const PHONE_MODELS_LIST = ['Samsung', 'iPhone', 'Tecno', 'Itel', 'Redmi', 'Honor', 'CAT'];
  const LAPTOP_MODELS_LIST = ['HP', 'Dell', 'iMac / MacBook', 'Samsung', 'Lenovo', 'Asus', 'Acer', 'Toshiba'];
  const DAMAGE_PRESETS = [
    { label: 'Water damage', icon: '💧' },
    { label: 'Broken screen', icon: '📱' },
    { label: 'Short circuit', icon: '⚡' },
    { label: 'Damaged speaker/mouthpiece', icon: '🔊' },
    { label: 'Need an upgrade', icon: '🚀' },
    { label: 'Body repair', icon: '🛠️' },
  ];

  const handleToggleDamage = (label: string) => {
    let updated: string[];
    if (selectedDamagePresets.includes(label)) {
      updated = selectedDamagePresets.filter((p) => p !== label);
    } else {
      updated = [...selectedDamagePresets, label];
    }
    setSelectedDamagePresets(updated);

    const presetText = updated.length > 0 ? `Issues: ${updated.join(', ')}` : '';
    const fullIssue = [presetText, issueNotes].filter(Boolean).join('\n\nAdditional Details:\n');
    setValue('issue', fullIssue);
  };

  const handleIssueNotesChange = (text: string) => {
    setIssueNotes(text);
    const presetText = selectedDamagePresets.length > 0 ? `Issues: ${selectedDamagePresets.join(', ')}` : '';
    const fullIssue = [presetText, text].filter(Boolean).join('\n\nAdditional Details:\n');
    setValue('issue', fullIssue);
  };

  const { data: deviceTypes } = useQuery({
    queryKey: ['deviceTypes'],
    queryFn: () => apiClient.get('/device-types').then(res => res.data)
  });

  const selectedDeviceTypeId = deviceTypes?.find((t: any) => t.name === selectedDeviceType)?.id;

  const { data: allModels } = useQuery({
    queryKey: ['deviceModels', selectedDeviceTypeId],
    queryFn: () => apiClient.get(`/models${selectedDeviceTypeId ? `?deviceTypeId=${selectedDeviceTypeId}` : ''}`).then(res => res.data),
    enabled: !!deviceTypes
  });

  const { data: shops, isLoading: shopsLoading } = useQuery({
    queryKey: ['shops', userLocation?.lat, userLocation?.lng],
    queryFn: () => apiClient.get('/shops/nearby', {
      params: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : {}
    }).then((res: AxiosResponse) => res.data),
  });

  const { data: technicians, isLoading: techniciansLoading } = useQuery({
    queryKey: ['technicians', selectedShop?.id],
    queryFn: () => apiClient.get(`/technician?shopId=${selectedShop?.id}`).then((res: AxiosResponse) => res.data),
    enabled: !!selectedShop,
  });

  const { data: history } = useQuery({
    queryKey: ['repairHistory'],
    queryFn: () => apiClient.get('/repairs/my').then((res: AxiosResponse) => res.data),
  });

  const { data: deliveryPartners } = useQuery({
    queryKey: ['deliveryPersonnel', selectedShop?.id, userLocation?.lat, userLocation?.lng],
    queryFn: () => apiClient.get('/delivery-personnel', {
      params: {
        ...(selectedShop?.id ? { shopId: selectedShop.id } : {}),
        ...(userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : {})
      }
    }).then((res) => res.data),
    enabled: (delivery || step === 'delivery-select') && (!!selectedShop || !!userLocation),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/repairs', {
      ...data,
      shopId: selectedShop?.id,
      technicianId: selectedTechnician?.id,
      deliveryPersonnelId: selectedDP?.id
    }),
    onSuccess: () => {
      alert('Repair scheduled successfully! Track your repair progress in real-time.');
      navigate({ to: '/tracking' });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message || 'Failed to schedule repair. Please try again.');
    }
  });

  const [shopStatusFilter, setShopStatusFilter] = useState<'all' | 'active'>('all');

  const handleShopSelect = (shop: any) => {
    const rawStatus = (shop.status || 'active').toLowerCase();
    if (rawStatus !== 'active') {
      alert(`⚠️ Notice: "${shop.name}" is currently marked as ${shop.status?.toUpperCase() || 'UNAVAILABLE'}${shop.statusNote ? ` (${shop.statusNote})` : ''}.\n\nThis location cannot accept new repair bookings at this time. Please select an active shop.`);
      return;
    }
    setSelectedShop(shop);
    setStep('technician');
  };

  const handleNextFromTechnician = () => {
    setStep('details');
  };

  const handleDPSelect = (dp: any) => {
    setSelectedDP(dp);
    setStep('details');
  };

  const onRepairSubmit = (data: any) => {
    if (!user) {
      alert('Please log in or register before submitting a repair request.');
      navigate({ to: '/login' });
      return;
    }
    mutation.mutate(data);
  };

  const filteredShops = shops?.filter((shop: any) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      shop.name.toLowerCase().includes(query) ||
      (shop.address && shop.address.toLowerCase().includes(query)) ||
      (shop.county && shop.county.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (shopStatusFilter === 'active') {
      const isAct = !shop.status || shop.status.toLowerCase() === 'active';
      if (!isAct) return false;
    }

    if (radiusFilter !== 'all' && userLocation && typeof shop.distanceKm === 'number') {
      const maxKm = parseFloat(radiusFilter);
      if (shop.distanceKm > maxKm) return false;
    }

    return true;
  });

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Hero Header */}
      <section className="glass-card rounded-[2.5rem] p-12 border border-white/10 shadow-premium relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 blur-[120px] -mr-48 -mt-48 transition-premium"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-brand mb-4 block">Repair Services</span>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter"> Ai Aided Expert Help, <span className="text-brand">Simplified.</span>
          </h1>
          <p className="text-white/60 text-xl font-medium leading-relaxed">
            {step === 'shop'
              ? 'Choose a certified shop nearby to start your repair journey.'
              : step === 'technician'
                ? `Select an expert technician at ${selectedShop?.name}.`
                : `Finalize details for your repair with ${selectedTechnician?.name}.`}
          </p>
        </div>
      </section>

      {step === 'shop' && (
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-3xl font-black text-white tracking-widest uppercase">Select Shop</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-brand/50 to-transparent"></div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter Toggle */}
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setShopStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    shopStatusFilter === 'all'
                      ? 'vibrant-gradient text-[#03131e] shadow-md'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  All ({shops?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setShopStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    shopStatusFilter === 'active'
                      ? 'vibrant-gradient text-[#03131e] shadow-md'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active Only
                </button>
              </div>

              <div className="relative w-full sm:w-72 group">
                <input
                  type="text"
                  placeholder="Search shops or county..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-2.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white placeholder:text-white/20 text-xs"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand transition-premium text-xs">🔍</span>
              </div>
            </div>
          </div>

          {/* Proximity Finding & Smart Filters Bar */}
          <div className="glass-card p-6 rounded-[2.5rem] border border-white/10 shadow-premium flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Geolocation Button */}
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-premium flex items-center gap-2.5 cursor-pointer shadow-lg ${
                  userLocation
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30'
                    : 'vibrant-gradient text-white hover:opacity-90'
                }`}
              >
                <span className={isLocating ? 'animate-spin' : ''}>
                  {isLocating ? '🧭' : userLocation ? '🎯' : '📍'}
                </span>
                <span>
                  {isLocating
                    ? 'Acquiring GPS...'
                    : userLocation
                    ? `Proximity Active (${userLocation.lat.toFixed(2)}, ${userLocation.lng.toFixed(2)})`
                    : 'Find Closest Shops Near Me'}
                </span>
              </button>

              {userLocation && (
                <button
                  type="button"
                  onClick={() => {
                    setUserLocation(null);
                    setRadiusFilter('all');
                  }}
                  className="px-3.5 py-3 rounded-2xl text-xs font-bold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-premium cursor-pointer"
                  title="Reset location filter"
                >
                  ✕ Reset
                </button>
              )}

              {/* Radius Filter Pills */}
              {userLocation && (
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                  {[
                    { label: 'All', value: 'all' },
                    { label: '≤ 5 km', value: '5' },
                    { label: '≤ 15 km', value: '15' },
                    { label: '≤ 30 km', value: '30' },
                  ].map((rad) => (
                    <button
                      key={rad.value}
                      type="button"
                      onClick={() => setRadiusFilter(rad.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        radiusFilter === rad.value
                          ? 'vibrant-gradient text-[#03131e] font-black shadow-md'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {rad.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* On-Demand Map Overview Modal Trigger */}
            <button
              type="button"
              onClick={() => {
                setMapModalShop(null);
                setIsMapModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-premium flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🗺️</span> View Map Overview
            </button>
          </div>

          {locationError && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{locationError}</span>
              </div>
              <button
                type="button"
                onClick={() => setLocationError(null)}
                className="text-amber-300/60 hover:text-amber-300 text-xs font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {shopsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card h-64 rounded-[2rem] animate-pulse border border-white/5 bg-white/5"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredShops?.map((shop: any) => {
                const rawStatus = (shop.status || 'active').toLowerCase();
                const isShopActive = rawStatus === 'active';
                const isCustom = !['active', 'closed', 'suspended', 'coming_soon'].includes(rawStatus);

                return (
                  <div
                    key={shop.id}
                    onClick={() => handleShopSelect(shop)}
                    className={`glass-card p-8 rounded-[2rem] border transition-premium shadow-lg group flex flex-col justify-between ${
                      !isShopActive
                        ? 'opacity-85 border-white/5 cursor-not-allowed bg-white/[0.02]'
                        : 'cursor-pointer hover:-translate-y-2'
                    } ${
                      selectedShop?.id === shop.id
                        ? 'border-brand ring-2 ring-brand/40 bg-brand/5'
                        : isShopActive
                        ? 'border-white/5 hover:border-brand/30'
                        : 'border-white/5 hover:border-rose-500/30'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="text-4xl group-hover:scale-110 transition-premium">🏬</div>
                        <div className="flex flex-col items-end gap-1.5">
                          {/* Status Badge */}
                          {rawStatus === 'active' && (
                            <span className="glass-card px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Open & Certified
                            </span>
                          )}
                          {rawStatus === 'closed' && (
                            <span className="glass-card px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              🔴 Closed
                            </span>
                          )}
                          {rawStatus === 'suspended' && (
                            <span className="glass-card px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              ⚠️ Suspended
                            </span>
                          )}
                          {rawStatus === 'coming_soon' && (
                            <span className="glass-card px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              🚀 Coming Soon
                            </span>
                          )}
                          {isCustom && (
                            <span className="glass-card px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand/20 text-brand border border-brand/30">
                              🏷️ {shop.status}
                            </span>
                          )}

                          {shop.distanceKm !== undefined && (
                            <span className={`glass-card px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                              shop.distanceKm <= 5
                                ? 'border-cyan-400/50 text-cyan-300 bg-cyan-500/20 font-black'
                                : 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
                            }`}>
                              <span>📍</span> {shop.distanceKm} km away {shop.distanceKm <= 5 ? '• Nearest' : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-2xl font-bold text-white mb-2">{shop.name}</h3>
                      <p className="text-white/40 text-sm mb-4 flex items-center gap-2">
                        <span className="text-brand">📍</span> {shop.address}
                      </p>

                      {shop.statusNote && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 mb-4 text-xs text-white/70 italic">
                          <span className="text-brand font-black not-italic text-[10px] uppercase tracking-wider block mb-0.5">Notice:</span>
                          "{shop.statusNote}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex items-center gap-1">
                        <span className="text-brand text-sm">⭐</span>
                        <span className="text-white font-bold text-sm">{shop.rating || '4.8'}</span>
                        {shop.county && (
                          <span className="text-white/30 text-xs ml-2 font-medium">({shop.county})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMapModalShop(shop);
                            setIsMapModalOpen(true);
                          }}
                          className="text-[11px] font-bold text-white/60 hover:text-cyan-300 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer"
                          title="View on Map"
                        >
                          🗺️ Map
                        </button>
                        {isShopActive ? (
                          <span className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Select →
                          </span>
                        ) : (
                          <span className="text-xs font-bold uppercase tracking-wider text-white/40 bg-white/5 px-2.5 py-1 rounded-lg">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {step === 'technician' && (
        <section className="space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setStep('shop')} className="glass-card px-4 py-2 rounded-xl text-white/40 font-bold text-xs uppercase tracking-widest hover:text-white transition-premium border border-white/5">← Shops</button>
            <h2 className="text-3xl font-black text-white tracking-widest uppercase">Select Technician</h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-brand/50 to-transparent"></div>
          </div>

          {techniciansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card h-64 rounded-[2rem] animate-pulse border border-white/5 bg-white/5"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {technicians?.map((tech: any) => (
                <div
                  key={tech.id}
                  onClick={() => {
                    setSelectedTechnician(tech);
                    handleNextFromTechnician();
                  }}
                  className="glass-card p-8 rounded-[2rem] border border-white/5 hover:border-brand/30 transition-premium shadow-lg cursor-pointer group hover:-translate-y-2"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-4xl group-hover:scale-110 transition-premium">👨‍🔧</div>
                    <span className="glass-card px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand/20 text-brand">Expert</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{tech.name}</h3>
                  <p className="text-white/40 text-sm mb-6">{tech.subCategory}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-1">
                      <span className="text-brand text-sm">⭐</span>
                      <span className="text-white font-bold text-sm">{tech.rating || '5.0'}</span>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1">Select →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {step === 'delivery-select' && (
        <section className="space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setStep('details')} className="glass-card px-4 py-2 rounded-xl text-white/40 font-bold text-xs uppercase tracking-widest hover:text-white transition-premium border border-white/5 cursor-pointer">
              ← Back to Details
            </button>
            <h2 className="text-3xl font-black text-white tracking-widest uppercase">Select Delivery Partner</h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-accent/50 to-transparent"></div>
          </div>

          {/* Delivery Proximity Banner */}
          {userLocation ? (
            <div className="glass-card p-6 rounded-[2rem] border border-cyan-500/30 bg-cyan-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-3xl">⚡</span>
                <div>
                  <h4 className="text-white font-bold text-base">Proximity Dispatch Active</h4>
                  <p className="text-cyan-200/80 text-xs">
                    Riders ranked by closest distance to your coordinates ({userLocation.lat.toFixed(2)}, {userLocation.lng.toFixed(2)}) for quickest arrival.
                  </p>
                </div>
              </div>
              <span className="glass-card px-4 py-2 rounded-xl border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-wider">
                {deliveryPartners?.length || 0} Available Couriers
              </span>
            </div>
          ) : (
            <div className="glass-card p-6 rounded-[2rem] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-3xl">📍</span>
                <div>
                  <h4 className="text-white font-bold text-base">Find Closest Courier to Your Door</h4>
                  <p className="text-white/50 text-xs">
                    Enable proximity finding to calculate real-time distance and estimated dispatch arrival times.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider vibrant-gradient text-white hover:opacity-90 transition-premium cursor-pointer shadow-lg shrink-0"
              >
                {isLocating ? 'Acquiring GPS...' : '📍 Detect My Location'}
              </button>
            </div>
          )}

          {deliveryPartners?.length === 0 ? (
            <div className="glass-card p-16 rounded-[2.5rem] border border-dashed border-white/10 text-center">
              <span className="text-5xl block mb-4">🚚</span>
              <h3 className="text-xl font-bold text-white mb-2">No Delivery Couriers Currently Available</h3>
              <p className="text-white/50 text-xs max-w-md mx-auto mb-6">
                There are no active delivery couriers registered for this center right now. You can continue with Walk-in / In-person drop-off.
              </p>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="px-6 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/20 transition-all cursor-pointer"
              >
                Return to Repair Details
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {deliveryPartners?.map((dp: any) => (
                <div
                  key={dp.id}
                  onClick={() => handleDPSelect(dp)}
                  className={`glass-card p-8 rounded-[2rem] border transition-premium shadow-lg cursor-pointer group hover:-translate-y-2 flex flex-col justify-between ${
                    selectedDP?.id === dp.id
                      ? 'border-accent ring-2 ring-accent/40 bg-accent/5'
                      : 'border-white/5 hover:border-accent/30'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="text-4xl group-hover:scale-110 transition-premium">🚚</div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="glass-card px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-accent/20 text-accent">
                          {dp.type === 'RealTime' ? '⚡ Express Courier' : '📦 Standard Carrier'}
                        </span>
                        {dp.distanceKm !== undefined && (
                          <span className={`glass-card px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                            dp.distanceKm <= 5
                              ? 'border-cyan-400/50 text-cyan-300 bg-cyan-500/20 font-black animate-pulse'
                              : 'border-white/10 text-white/70 bg-white/5'
                          }`}>
                            <span>📍</span> {dp.distanceKm} km away {dp.distanceKm <= 5 ? '• Nearest' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-1">{dp.name}</h3>
                    <p className="text-white/40 text-xs mb-3 flex items-center gap-1.5">
                      <span>🏬</span> {dp.shop?.name || selectedShop?.name || 'Local Hub'}{dp.region ? ` (${dp.region})` : ''}
                    </p>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 mb-4 text-xs flex items-center justify-between">
                      <span className="text-white/50">Est. Dispatch:</span>
                      <span className="font-bold text-emerald-400">
                        {dp.distanceKm !== undefined
                          ? dp.distanceKm <= 5
                            ? '⚡ ~15-25 min pickup'
                            : dp.distanceKm <= 15
                            ? '🚚 ~30-45 min pickup'
                            : '📦 Scheduled route'
                          : '🚚 Standard route'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-1">
                      <span className="text-accent text-sm">⭐</span>
                      <span className="text-white font-bold text-sm">{dp.rating || '4.9'}</span>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      {selectedDP?.id === dp.id ? '✓ Selected' : 'Select Courier →'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {step === 'details' && (
        <section className="animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setStep('technician')} className="glass-card px-4 py-2 rounded-xl text-white/40 font-bold text-xs uppercase tracking-widest hover:text-white transition-premium border border-white/5">← Technician</button>
            <h2 className="text-3xl font-black text-white tracking-widest uppercase">Repair Details</h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-brand/50 to-transparent"></div>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="glass-card p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <form onSubmit={handleSubmit(onRepairSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">
                      Device Category
                    </label>
                    <div className="relative">
                      <select
                        value={categorySelection}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setCategorySelection(val);
                          if (val === 'Phone') {
                            setValue('device_type', 'Phone');
                          } else if (val === 'Computer / Laptop') {
                            setValue('device_type', 'Computer/Laptop');
                          } else if (val === 'Other') {
                            setValue('device_type', customCategoryText || 'Other');
                          } else {
                            setValue('device_type', '');
                          }
                          setValue('device_model', '');
                          setManualModelInput('');
                        }}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-canvas text-white">Select Category...</option>
                        <option value="Phone" className="bg-canvas text-white">📱 Phone</option>
                        <option value="Computer / Laptop" className="bg-canvas text-white">💻 Computer / Laptop</option>
                        <option value="Other" className="bg-canvas text-white">⚙️ Other (Custom)</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">▼</div>
                    </div>
                    {errors.device_type && (
                      <p className="text-brand text-[10px] font-bold uppercase tracking-widest mt-1 ml-1">
                        {errors.device_type.message as string}
                      </p>
                    )}

                    {categorySelection === 'Other' && (
                      <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
                        <input
                          type="text"
                          value={customCategoryText}
                          onChange={(e) => {
                            setCustomCategoryText(e.target.value);
                            setValue('device_type', e.target.value || 'Other');
                          }}
                          placeholder="e.g. Smartwatch, Tablet, Game Console, Audio..."
                          className="w-full px-5 py-3 bg-white/5 border border-brand/40 rounded-xl outline-none text-white text-xs placeholder:text-white/30 focus:ring-2 focus:ring-brand"
                        />
                      </div>
                    )}
                  </div>

                  {/* Model Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">
                      Device Model
                    </label>

                    {categorySelection === 'Phone' ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <select
                            value={selectedDeviceModel}
                            onChange={(e) => {
                              const val = e.target.value;
                              setValue('device_model', val);
                              if (val !== 'not_on_list') {
                                setManualModelInput('');
                              }
                            }}
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-canvas text-white">Select Phone Brand / Model...</option>
                            <optgroup label="Popular Phone Brands" className="bg-canvas text-brand font-bold">
                              {PHONE_MODELS_LIST.map((model) => (
                                <option key={model} value={model} className="bg-canvas text-white">
                                  {model}
                                </option>
                              ))}
                            </optgroup>
                            {allModels && allModels.length > 0 && (
                              <optgroup label="Catalog Models" className="bg-canvas text-cyan-400 font-bold">
                                {allModels.map((m: any) => (
                                  <option key={m.id} value={m.name} className="bg-canvas text-white">
                                    {m.name} ({m.brand})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <option value="not_on_list" className="bg-canvas text-white">✍️ Other / Manual Input...</option>
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">▼</div>
                        </div>

                        {selectedDeviceModel === 'not_on_list' && (
                          <div className="animate-in slide-in-from-top-2 duration-300">
                            <input
                              type="text"
                              value={manualModelInput}
                              onChange={(e) => {
                                setManualModelInput(e.target.value);
                                setValue('device_model', e.target.value);
                              }}
                              placeholder="e.g. Tecno Camon 20 Pro, iPhone 14 Pro, Samsung S23..."
                              className="w-full px-5 py-3 bg-white/5 border border-brand/40 rounded-xl outline-none text-white text-xs placeholder:text-white/30 focus:ring-2 focus:ring-brand"
                            />
                          </div>
                        )}
                      </div>
                    ) : categorySelection === 'Computer / Laptop' ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <select
                            value={selectedDeviceModel}
                            onChange={(e) => {
                              const val = e.target.value;
                              setValue('device_model', val);
                              if (val !== 'not_on_list') {
                                setManualModelInput('');
                              }
                            }}
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-canvas text-white">Select PC / Laptop Brand...</option>
                            <optgroup label="PC / Laptop Brands" className="bg-canvas text-brand font-bold">
                              {LAPTOP_MODELS_LIST.map((model) => (
                                <option key={model} value={model} className="bg-canvas text-white">
                                  {model}
                                </option>
                              ))}
                            </optgroup>
                            {allModels && allModels.length > 0 && (
                              <optgroup label="Catalog Models" className="bg-canvas text-cyan-400 font-bold">
                                {allModels.map((m: any) => (
                                  <option key={m.id} value={m.name} className="bg-canvas text-white">
                                    {m.name} ({m.brand})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <option value="not_on_list" className="bg-canvas text-white">✍️ Other / Manual Input...</option>
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">▼</div>
                        </div>

                        {selectedDeviceModel === 'not_on_list' && (
                          <div className="animate-in slide-in-from-top-2 duration-300">
                            <input
                              type="text"
                              value={manualModelInput}
                              onChange={(e) => {
                                setManualModelInput(e.target.value);
                                setValue('device_model', e.target.value);
                              }}
                              placeholder="e.g. HP Pavilion 15, Dell Latitude 5420, MacBook Air M2..."
                              className="w-full px-5 py-3 bg-white/5 border border-brand/40 rounded-xl outline-none text-white text-xs placeholder:text-white/30 focus:ring-2 focus:ring-brand"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <input
                          type="text"
                          value={selectedDeviceModel}
                          onChange={(e) => setValue('device_model', e.target.value)}
                          placeholder="e.g. Custom Unit, Specific Model Name..."
                          className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white placeholder:text-white/20"
                        />
                      </div>
                    )}

                    {errors.device_model && (
                      <p className="text-brand text-[10px] font-bold uppercase tracking-widest mt-1 ml-1">
                        {errors.device_model.message as string}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Payment Method</label>
                    <div className="relative">
                      <select
                        {...register('paymentMethod')}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white appearance-none cursor-pointer"
                      >
                        <option value="cod" className="bg-canvas text-white">Walk-in / Cash on Delivery</option>
                        <option value="online" className="bg-canvas text-white">Online Payment (10% Discount)</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">▼</div>
                    </div>
                  </div>
                </div>

                {/* Damage Issues & Description */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">
                      Common Damage Descriptions (Click to Select)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {DAMAGE_PRESETS.map((preset) => {
                        const isSelected = selectedDamagePresets.includes(preset.label);
                        return (
                          <button
                            type="button"
                            key={preset.label}
                            onClick={() => handleToggleDamage(preset.label)}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-brand/20 border-brand text-brand shadow-md shadow-brand/10 ring-1 ring-brand'
                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                            }`}
                          >
                            <span className="text-base">{preset.icon}</span>
                            <span className="truncate">{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">
                      Issue Description & Symptoms
                    </label>
                    <textarea
                      value={issueNotes}
                      onChange={(e) => handleIssueNotesChange(e.target.value)}
                      placeholder="Describe what's wrong with your device, specific symptoms, or repair requirements..."
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white placeholder:text-white/20 h-36 resize-none"
                    />
                    {errors.issue && (
                      <p className="text-brand text-[10px] font-bold uppercase tracking-widest mt-1 ml-1">
                        {errors.issue.message as string}
                      </p>
                    )}
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border transition-premium ${delivery ? 'bg-brand/10 border-brand/30' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-premium ${delivery ? 'bg-brand text-white' : 'bg-white/10 text-white/40'}`}>
                        🚚
                      </div>
                      <div>
                        <p className="text-white font-bold">Request Pickup & Delivery</p>
                        <p className="text-white/40 text-xs font-medium">A professional will handle transport</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" {...register('delivery')} className="sr-only peer" />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                    </label>
                  </div>
                </div>

                {delivery && (
                  <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Select Delivery Partner</label>
                        <button
                          type="button"
                          onClick={() => setStep('delivery-select')}
                          className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>🚚</span> View All Nearest Couriers ({deliveryPartners?.length || 0}) →
                        </button>
                      </div>
                      <div className="relative">
                        <select
                          value={selectedDP?.id || ''}
                          onChange={(e) => {
                            const dp = deliveryPartners?.find((p: any) => p.id === e.target.value);
                            setSelectedDP(dp);
                          }}
                          className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-premium text-white appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-canvas text-white">Select a delivery partner...</option>
                          {deliveryPartners?.map((dp: any) => (
                            <option key={dp.id} value={dp.id} className="bg-canvas text-white">
                              {dp.name} ({dp.type}) {dp.distanceKm !== undefined ? `• 📍 ${dp.distanceKm} km away` : ''} - {dp.region || dp.shop?.name || ''}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">▼</div>
                      </div>
                      {!selectedDP && (
                        <p className="text-accent text-[10px] font-bold uppercase tracking-widest mt-1 ml-1 animate-pulse">Required for delivery service</p>
                      )}
                      {selectedDP && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                          <span className="text-white/60">Selected courier: <strong className="text-white">{selectedDP.name}</strong></span>
                          {selectedDP.distanceKm !== undefined && (
                            <span className="text-cyan-400 font-bold">📍 {selectedDP.distanceKm} km from you</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-xs text-white/40 leading-relaxed italic">
                      ✨ Note: Our delivery personnel team will reach out to schedule the pickup once your request is received.
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={mutation.isPending || (delivery && !selectedDP)}
                  className="w-full vibrant-gradient text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-premium shadow-xl mt-4 disabled:opacity-50"
                >
                  {mutation.isPending ? 'Scheduling...' : (delivery && !selectedDP) ? 'Select Delivery Partner' : 'Confirm Schedule'}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Repair History Section */}
      <section className="space-y-8 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-3xl font-black text-white tracking-widest uppercase">Repair History</h2>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>

        {!history || history.length === 0 ? (
          <div className="glass-card p-16 rounded-[3rem] border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-white/10">
            <div className="text-6xl mb-6">🛠️</div>
            <p className="font-bold uppercase tracking-[0.2em]">No repair history available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {history.map((repair: any) => (
              <div key={repair.id} className="glass-card p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-brand/30 transition-premium">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-xl">🔧</div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{repair.device_type || repair.deviceType}</h4>
                    <p className="text-white/40 text-xs uppercase font-black tracking-widest">{repair.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-sm">{new Date(repair.createdAt || repair.created_at).toLocaleDateString()}</p>
                  <button onClick={() => window.location.href = `/tracking?id=${repair.id}`} className="text-brand text-xs font-black uppercase tracking-widest mt-1 hover:underline">Track Status →</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* On-Demand Interactive Google Map Modal */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-card max-w-4xl w-full rounded-[2.5rem] p-6 md:p-8 border border-white/20 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-2">
                  <span>🗺️</span> {mapModalShop ? mapModalShop.name : 'Repair Centers Map Overview'}
                </h3>
                <p className="text-white/50 text-xs">
                  {mapModalShop
                    ? `${mapModalShop.address || ''}${mapModalShop.county ? `, ${mapModalShop.county}` : ''}`
                    : 'Interactive map of certified Electrocare repair shops and drop-off hubs.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMapModalOpen(false);
                  setMapModalShop(null);
                }}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="rounded-[1.5rem] overflow-hidden border border-white/10 shadow-inner h-[380px] md:h-[460px] relative">
              <GoogleMapView
                userLocation={userLocation}
                shops={mapModalShop ? [mapModalShop] : (filteredShops || [])}
                selectedShopId={mapModalShop?.id || selectedShop?.id}
                onSelectShop={(shp) => {
                  handleShopSelect(shp);
                  setIsMapModalOpen(false);
                }}
                onUserLocationFound={(loc) => setUserLocation(loc)}
                className="w-full h-full"
              />
            </div>

            {mapModalShop && (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
                <div>
                  <span className="text-xs text-white/50">Status: </span>
                  <span className="text-xs font-bold text-white capitalize">{mapModalShop.status || 'Active'}</span>
                  {mapModalShop.distanceKm !== undefined && (
                    <span className="text-xs text-cyan-400 font-bold ml-2">• 📍 {mapModalShop.distanceKm} km away</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleShopSelect(mapModalShop);
                    setIsMapModalOpen(false);
                  }}
                  className="px-6 py-2.5 rounded-xl vibrant-gradient text-[#03131e] font-black text-xs uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer shadow-lg"
                >
                  Select This Shop →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleRepair;
