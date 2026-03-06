import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import apiClient from '../utils/apiClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saleSchema } from '../utils/validators';
import useAuth from '../hooks/useAuth';

interface Listing {
  id: string;
  device: string;
  description: string;
  price: number;
  imageUrls?: string[];
  condition: string;
  serialNumber: string;
  mainCategory: string;
  subCategory: string;
  user: { name: string };
  createdAt: string;
}

const MarketplacePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const search = useSearch({ from: '/marketplace' }) as { action?: string };
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      device: '',
      description: '',
      price: 0,
      condition: 'Used' as any,
      mainCategory: 'Mobile Phone' as any,
      subCategory: 'Device' as any
    }
  });

  const [activeTab, setActiveTab] = useState<'All' | 'Mobile' | 'Laptop'>('All');

  useEffect(() => {
    if (search.action === 'sell-dead') {
      setShowForm(true);
      setValue('condition', 'Unusable');
    }
  }, [search.action, setValue]);

  const { data: listings, isLoading } = useQuery({
    queryKey: ['marketplace'],
    queryFn: () => apiClient.get('/marketplace').then((res) => res.data),
  });

  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const postMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/marketplace', {
      ...data,
      price: Number(data.price),
      imageUrls: uploadedUrls
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      setShowForm(false);
      reset();
      setUploadedUrls([]);
      alert('Listing submitted successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to post listing. Please try again.');
    }
  });

  const purchaseMutation = useMutation({
    mutationFn: (listing: Listing) => apiClient.post('/marketplace/purchase', {
      saleId: listing.id,
      price: listing.price
    }),
    onSuccess: () => {
      alert('Purchase request submitted! Awaiting approval.');
      setSelectedListing(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Purchase failed');
    }
  });

  const handleImageUpload = async (file: File) => {
    if (uploadedUrls.length >= 5) return alert('Max 5 images allowed');
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedUrls(prev => [...prev, res.data.imageUrl]);
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setUploadedUrls(prev => prev.filter(u => u !== url));
  };

  const onSubmit = (data: any) => {
    postMutation.mutate(data);
  };

  const categorizedListings = useMemo(() => {
    if (!listings) return { mobileDevices: [], mobileAccessories: [], laptopDevices: [], laptopAccessories: [] };

    return {
      mobileDevices: listings.filter((l: any) => l.mainCategory === 'Mobile Phone' && l.subCategory === 'Device'),
      mobileAccessories: listings.filter((l: any) => l.mainCategory === 'Mobile Phone' && l.subCategory === 'Accessory'),
      laptopDevices: listings.filter((l: any) => l.mainCategory === 'Laptop' && l.subCategory === 'Device'),
      laptopAccessories: listings.filter((l: any) => l.mainCategory === 'Laptop' && l.subCategory === 'Accessory'),
    };
  }, [listings]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/30 animate-pulse">
      <div className="text-6xl mb-4">🛒</div>
      <p className="text-xl font-black uppercase tracking-widest">Loading Marketplace...</p>
    </div>
  );

  const ListingCard = ({ listing }: { listing: Listing }) => (
    <div
      onClick={() => setSelectedListing(listing)}
      className="glass-card rounded-2xl overflow-hidden border border-white/5 hover:border-brand/30 transition-premium hover:shadow-xl p-4 cursor-pointer group"
    >
      <div className="h-40 bg-white/5 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
        {listing.imageUrls && listing.imageUrls.length > 0 ? (
          <img src={listing.imageUrls[0]} alt={listing.device} className="h-full w-full object-cover rounded-xl group-hover:scale-110 transition-premium duration-700" />
        ) : (
          <span className="text-3xl">{listing.mainCategory === 'Laptop' ? '💻' : '📱'}</span>
        )}
        <div className="absolute top-2 right-2 glass-card px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-brand/20 text-brand backdrop-blur-md">
          {listing.condition}
        </div>
      </div>
      <h3 className="font-bold text-white truncate">{listing.device}</h3>
      <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{listing.subCategory}</p>
      <div className="flex justify-between items-center">
        <span className="text-xl font-black text-white">${listing.price}</span>
        <button className="text-brand text-[10px] font-black uppercase tracking-widest underline underline-offset-4">View</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-10">
      {/* Hero Section */}
      <section className="glass-card rounded-[2.5rem] p-12 border border-white/10 shadow-premium relative overflow-hidden group text-center md:text-left">
        <div className="absolute inset-0 opacity-10 bg-[url('/check_out.gif')] bg-cover bg-center group-hover:scale-105 transition-premium duration-1000"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-canvas via-canvas/90 to-transparent"></div>

        <div className="relative z-10">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-brand mb-4 block">Official Marketplace</span>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-tight">
            The Repair <span className="text-brand">Hub.</span>
          </h1>
          <p className="text-white/60 text-xl font-medium max-w-2xl mb-10 leading-relaxed mx-auto md:mx-0">
            Securely trade mobile phones, laptops, and premium accessories verified by ElectroCare.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <button
              onClick={() => setShowForm(!showForm)}
              className="premium-gradient text-white font-black uppercase tracking-widest py-5 px-12 rounded-2xl transition-premium hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              {showForm ? '❌ Cancel' : '🚀 Sell Something'}
            </button>
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
              {['All', 'Mobile', 'Laptop'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-premium ${activeTab === tab ? 'vibrant-gradient text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showForm && (
        <div className="animate-in slide-in-from-top-4 duration-500">
          <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-10 rounded-[2rem] border border-white/10 shadow-2xl max-w-3xl mx-auto">
            <h2 className="text-3xl font-black text-white mb-8 tracking-tight text-center uppercase">List Your Device</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Main Category</label>
                <select {...register('mainCategory')} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-white appearance-none">
                  <option value="Mobile Phone" className="bg-canvas">Mobile Phone</option>
                  <option value="Laptop" className="bg-canvas">Laptop</option>
                </select>
                {errors.mainCategory && <p className="text-brand text-[10px] font-black uppercase tracking-widest mt-1 ml-1">{errors.mainCategory.message as string}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Subcategory</label>
                <select {...register('subCategory')} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-white appearance-none">
                  <option value="Device" className="bg-canvas">Device / Unit</option>
                  <option value="Accessory" className="bg-canvas">Accessory</option>
                </select>
                {errors.subCategory && <p className="text-brand text-[10px] font-black uppercase tracking-widest mt-1 ml-1">{errors.subCategory.message as string}</p>}
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Device Name</label>
                <input {...register('device')} placeholder="e.g. MacBook Pro M2 14-inch" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-white" />
                {errors.device && <p className="text-brand text-[10px] font-black uppercase tracking-widest mt-1 ml-1">{errors.device.message as string}</p>}
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Description</label>
                <textarea {...register('description')} placeholder="Detail condition, specs, etc." className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-white h-32" />
                {errors.description && <p className="text-brand text-[10px] font-black uppercase tracking-widest mt-1 ml-1">{errors.description.message as string}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Price ($)</label>
                <input {...register('price', { valueAsNumber: true })} type="number" placeholder="0.00" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-white" />
                {errors.price && <p className="text-brand text-[10px] font-black uppercase tracking-widest mt-1 ml-1">{errors.price.message as string}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Condition</label>
                <select {...register('condition')} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-white appearance-none">
                  <option value="Used" className="bg-canvas">Used</option>
                  <option value="Refurbished" className="bg-canvas">Refurbished</option>
                  <option value="New" className="bg-canvas">New</option>
                  <option value="Unusable" className="bg-canvas">Dead / For Points</option>
                </select>
                {watch('condition') === 'Refurbished' && user?.role !== 'admin' && user?.role !== 'shop' && (
                  <div className="p-3 bg-brand/10 border border-brand/20 rounded-xl mt-2">
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest">
                      ⚠️ Shop verification required for refurbished items.
                    </p>
                  </div>
                )}
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Images (Up to 5)</label>
                <div className="grid grid-cols-5 gap-4">
                  {uploadedUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl border border-white/10 overflow-hidden">
                      <img src={url} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(url)} className="absolute top-1 right-1 bg-red-500 rounded-full p-1 text-[8px] text-white">✕</button>
                    </div>
                  ))}
                  {uploadedUrls.length < 5 && (
                    <label className="flex items-center justify-center aspect-square border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-premium">
                      {uploading ? (
                        <div className="animate-spin text-xl text-brand">⏳</div>
                      ) : (
                        <span className="text-2xl text-white/20 hover:text-brand transition-premium">+</span>
                      )}
                      <input type="file" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                    </label>
                  )}
                </div>
              </div>
              <button type="submit" className="col-span-1 md:col-span-2 vibrant-gradient text-white py-5 rounded-2xl font-black uppercase tracking-widest mt-4">
                List Item for Sale
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sections */}
      {(activeTab === 'All' || activeTab === 'Mobile') && (
        <div className="space-y-10">
          <div className="flex items-center gap-6">
            <h2 className="text-4xl font-black text-white tracking-widest uppercase">Mobile Phones</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-brand/50 to-transparent"></div>
          </div>

          <div className="space-y-8">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/30 border-l-2 border-brand pl-4">Units & Devices</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categorizedListings.mobileDevices.length > 0 ? (
                categorizedListings.mobileDevices.map((l: any) => <ListingCard key={l.id} listing={l} />)
              ) : (
                <p className="text-white/10 text-xs font-black uppercase tracking-widest col-span-full">No mobile devices listed.</p>
              )}
            </div>

            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/30 border-l-2 border-white/10 pl-4">Accessories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categorizedListings.mobileAccessories.length > 0 ? (
                categorizedListings.mobileAccessories.map((l: any) => <ListingCard key={l.id} listing={l} />)
              ) : (
                <p className="text-white/10 text-xs font-black uppercase tracking-widest col-span-full">No accessories listed.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'All' || activeTab === 'Laptop') && (
        <div className="space-y-10 pt-10">
          <div className="flex items-center gap-6">
            <h2 className="text-4xl font-black text-white tracking-widest uppercase">Laptops</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
          </div>

          <div className="space-y-8">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/30 border-l-2 border-blue-500 pl-4">Units & Devices</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categorizedListings.laptopDevices.length > 0 ? (
                categorizedListings.laptopDevices.map((l: any) => <ListingCard key={l.id} listing={l} />)
              ) : (
                <p className="text-white/10 text-xs font-black uppercase tracking-widest col-span-full">No laptops listed.</p>
              )}
            </div>

            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/30 border-l-2 border-white/10 pl-4">Accessories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categorizedListings.laptopAccessories.length > 0 ? (
                categorizedListings.laptopAccessories.map((l: any) => <ListingCard key={l.id} listing={l} />)
              ) : (
                <p className="text-white/10 text-xs font-black uppercase tracking-widest col-span-full">No accessories listed.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-canvas/90 backdrop-blur-2xl" onClick={() => setSelectedListing(null)}></div>
          <div className="glass-card w-full max-w-5xl rounded-[3rem] border border-white/10 shadow-premium overflow-hidden relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedListing(null)} className="absolute top-10 right-10 text-white/20 hover:text-white transition-premium z-20">
              <span className="text-3xl">✕</span>
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-10 space-y-6">
                <div className="aspect-square bg-white/5 rounded-3xl overflow-hidden border border-white/10 relative">
                  <img src={selectedListing.imageUrls?.[activeImageIndex] || ''} className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {selectedListing.imageUrls?.map((url, i) => (
                    <img key={i} src={url} onClick={() => setActiveImageIndex(i)} className={`h-24 w-24 object-cover rounded-2xl cursor-pointer border-2 transition-premium ${activeImageIndex === i ? 'border-brand' : 'border-transparent opacity-50'}`} />
                  ))}
                </div>
              </div>
              <div className="p-16 flex flex-col justify-center">
                <div className="flex gap-3 mb-6">
                  <span className="px-4 py-1.5 bg-brand/20 text-brand rounded-full text-[10px] font-black uppercase tracking-widest">{selectedListing.mainCategory}</span>
                  <span className="px-4 py-1.5 bg-white/10 text-white/60 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedListing.condition}</span>
                </div>
                <h2 className="text-5xl font-black text-white mb-6 tracking-tighter leading-tight">{selectedListing.device}</h2>
                <p className="text-white/50 text-xl font-medium leading-relaxed mb-10">{selectedListing.description}</p>
                <div className="flex justify-between items-center pt-10 border-t border-white/5">
                  <span className="text-5xl font-black text-white">${selectedListing.price}</span>
                  <button onClick={() => purchaseMutation.mutate(selectedListing)} className="premium-gradient text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-premium">Buy Now</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
