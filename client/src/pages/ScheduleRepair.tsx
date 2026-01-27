import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';
import { AxiosResponse } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { repairSchema } from '../utils/validators';

const ScheduleRepair: React.FC = () => {
  const [step, setStep] = useState<'shop' | 'technician' | 'delivery-select' | 'details'>('shop');
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);
  const [selectedDP, setSelectedDP] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const { data: deviceTypes } = useQuery({
    queryKey: ['deviceTypes'],
    queryFn: () => apiClient.get('/device-types').then(res => res.data)
  });

  const { data: allModels } = useQuery({
    queryKey: ['deviceModels'],
    queryFn: () => apiClient.get('/models').then(res => res.data)
  });

  const { data: shops, isLoading: shopsLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: () => apiClient.get('/shops/nearby').then((res: AxiosResponse) => res.data),
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
    queryKey: ['deliveryPersonnel', selectedShop?.id],
    queryFn: () => apiClient.get(`/delivery-personnel?shopId=${selectedShop?.id}`).then((res) => res.data),
    enabled: delivery && !!selectedShop,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/repairs', {
      ...data,
      shopId: selectedShop?.id,
      technicianId: selectedTechnician?.id,
      deliveryPersonnelId: selectedDP?.id
    }),
    onSuccess: () => {
      window.location.href = '/tracking';
    },
  });

  const handleShopSelect = (shop: any) => {
    setSelectedShop(shop);
    setStep('technician');
  };

  const handleNextFromTechnician = () => {
    setStep('details');
  };

  const handleDPSelect = (dp: any) => {
    setSelectedDP(dp);
    // Stay in details or show confirmation? For now, we'll keep it in details if we show it there.
    // If it's a separate step, we need to go back to details.
    setStep('details');
  };

  const onRepairSubmit = (data: any) => {
    mutation.mutate(data);
  };

  const filteredShops = shops?.filter((shop: any) =>
    shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="text-3xl font-black text-white tracking-widest uppercase">Select Shop</h2>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-brand/50 to-transparent"></div>
            </div>

            <div className="relative w-full md:w-80 group">
              <input
                type="text"
                placeholder="Search shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white placeholder:text-white/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand transition-premium">🔍</span>
            </div>
          </div>

          {shopsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card h-64 rounded-[2rem] animate-pulse border border-white/5 bg-white/5"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredShops?.map((shop: any) => (
                <div
                  key={shop.id}
                  onClick={() => handleShopSelect(shop)}
                  className="glass-card p-8 rounded-[2rem] border border-white/5 hover:border-brand/30 transition-premium shadow-lg cursor-pointer group hover:-translate-y-2"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-4xl group-hover:scale-110 transition-premium">🏬</div>
                    <span className="glass-card px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand/20 text-brand">Certified</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{shop.name}</h3>
                  <p className="text-white/40 text-sm mb-6 flex items-center gap-2">
                    <span className="text-brand">📍</span> {shop.location?.coordinates ? `${shop.location.coordinates[0]}, ${shop.location.coordinates[1]}` : shop.address}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-1">
                      <span className="text-brand text-sm">⭐</span>
                      <span className="text-white font-bold text-sm">{shop.rating || '4.8'}</span>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1">Select →</span>
                  </div>
                </div>
              ))}
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
            <button onClick={() => setStep('technician')} className="glass-card px-4 py-2 rounded-xl text-white/40 font-bold text-xs uppercase tracking-widest hover:text-white transition-premium border border-white/5">← Technician</button>
            <h2 className="text-3xl font-black text-white tracking-widest uppercase">Select Delivery Partner</h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-accent/50 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {deliveryPartners?.map((dp: any) => (
              <div
                key={dp.id}
                onClick={() => handleDPSelect(dp)}
                className="glass-card p-8 rounded-[2rem] border border-white/5 hover:border-accent/30 transition-premium shadow-lg cursor-pointer group hover:-translate-y-2"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="text-4xl group-hover:scale-110 transition-premium">🚚</div>
                  <span className="glass-card px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-accent/20 text-accent">{dp.type}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{dp.name}</h3>
                <p className="text-white/40 text-sm mb-6">{dp.region}</p>
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex items-center gap-1">
                    <span className="text-accent text-sm">⭐</span>
                    <span className="text-white font-bold text-sm">{dp.rating}</span>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-1">Select →</span>
                </div>
              </div>
            ))}
          </div>
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
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Device Category</label>
                    <select
                      {...register('device_type')}
                      onChange={(e) => {
                        setValue('device_type', e.target.value);
                        setValue('device_model', ''); // Reset model on type change
                      }}
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-canvas">Select Category...</option>
                      {deviceTypes?.map((type: any) => (
                        <option key={type.id} value={type.name} className="bg-canvas">{type.name}</option>
                      ))}
                      <option value="Other" className="bg-canvas">Other</option>
                    </select>
                    {errors.device_type && <p className="text-brand text-[10px] font-bold uppercase tracking-widest mt-1 ml-1">{errors.device_type.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Device Model</label>
                    <div className="relative">
                      <select
                        {...register('device_model')}
                        onChange={(e) => {
                          setValue('device_model', e.target.value);
                        }}
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-canvas text-white">Select Model...</option>
                        {allModels?.filter((m: any) => m.deviceTypeId === deviceTypes?.find((t: any) => t.name === selectedDeviceType)?.id).map((model: any) => (
                          <option key={model.id} value={model.name} className="bg-canvas text-white">
                            {model.name} ({model.brand})
                          </option>
                        ))}
                        <option value="not_on_list" className="bg-canvas text-white">Not on the list...</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">▼</div>
                    </div>
                  </div>
                </div>

                {selectedDeviceModel === 'not_on_list' && (
                  <div className="animate-in slide-in-from-top-2 duration-300 space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Enter Device Model Manually</label>
                    <input
                      onChange={(e) => {
                        setValue('device_model', e.target.value);
                      }}
                      placeholder="e.g. Custom Gaming PC, Legacy Device"
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white placeholder:text-white/20"
                    />
                  </div>
                )}

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

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Issue Description</label>
                  <textarea
                    {...register('issue')}
                    placeholder="Describe what's wrong with your device..."
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white placeholder:text-white/20 h-40 resize-none"
                  />
                  {errors.issue && <p className="text-brand text-[10px] font-bold uppercase tracking-widest mt-1 ml-1">{errors.issue.message as string}</p>}
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
                      <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Select Delivery Partner</label>
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
                              {dp.name} ({dp.type}) - {dp.region}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">▼</div>
                      </div>
                      {!selectedDP && (
                        <p className="text-accent text-[10px] font-bold uppercase tracking-widest mt-1 ml-1 animate-pulse">Required for delivery service</p>
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
    </div>
  );
};

export default ScheduleRepair;
