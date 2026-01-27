import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import apiClient from '../utils/apiClient';
import { useForm } from 'react-hook-form';

interface Listing {
  id: string;
  device: string;
  description: string;
  price: number;
  imageUrls?: string[];
  condition: string;
  serialNumber: string;
  category?: string;
  subCategory?: string;
  user: { name: string };
  createdAt: string;
}

const MarketplacePage: React.FC = () => {
  const queryClient = useQueryClient();
  const search = useSearch({ from: '/marketplace' }) as { action?: string };
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (search.action === 'sell-dead') {
      setShowForm(true);
      setValue('condition', 'Unusable');
    }
  }, [search.action, setValue]);

  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
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
    },
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

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/30 animate-pulse">
      <div className="text-6xl mb-4">🛒</div>
      <p className="text-xl font-black uppercase tracking-widest">Loading Marketplace...</p>
    </div>
  );

  const filteredListings = listings?.filter((l: Listing) =>
    !selectedCondition || l.condition === selectedCondition
  ) || [];

  const newArrivals = listings?.slice(0, 3) || [];
  const allListings = filteredListings;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-10">
      {/* Hero Section */}
      <section className="glass-card rounded-[2.5rem] p-12 border border-white/10 shadow-premium relative overflow-hidden group">
        <div className="absolute inset-0 opacity-20 bg-[url('/check_out.gif')] bg-cover bg-center group-hover:scale-105 transition-premium duration-1000"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-canvas via-canvas/80 to-transparent"></div>

        <div className="relative z-10">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-brand mb-4 block">Official Marketplace</span>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter">
            Trade with <span className="text-brand">Confidence.</span>
          </h1>
          <p className="text-white/60 text-xl font-medium max-w-2xl mb-8 leading-relaxed">
            Discover verified used, refurbished, and new devices from our trusted community and certified shops.
          </p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="premium-gradient text-white font-black uppercase tracking-widest py-4 px-10 rounded-2xl transition-premium hover:shadow-2xl hover:scale-105 active:scale-95"
          >
            {showForm ? '❌ Close Form' : '🚀 Post an Item'}
          </button>
        </div>
      </section>

      {/* Post Item Form */}
      {showForm && (
        <div className="animate-in slide-in-from-top-4 duration-500">
          <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-10 rounded-[2rem] border border-white/10 shadow-2xl max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-white mb-8 tracking-tight">Post a Device</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Device Name</label>
                <input {...register('title')} placeholder="e.g. iPhone 13 Pro Max" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white" required />
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Description</label>
                <textarea {...register('description')} placeholder="Tell us about the device condition, specs, etc." className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white h-32" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Price ($)</label>
                <input {...register('price')} type="number" placeholder="0.00" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Condition</label>
                <select {...register('condition')} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white appearance-none">
                  <option value="Used" className="bg-canvas">Used</option>
                  <option value="Refurbished" className="bg-canvas">Refurbished</option>
                  <option value="New" className="bg-canvas">New</option>
                  <option value="Unusable" className="bg-canvas">Dead / Unused (Sell for points)</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Device Category</label>
                <select {...register('category')} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white appearance-none">
                  <option value="Mobile Phone" className="bg-canvas">Mobile Phone</option>
                  <option value="Laptop" className="bg-canvas">Laptop</option>
                  <option value="Television" className="bg-canvas">Television</option>
                  <option value="Fridge" className="bg-canvas">Fridge</option>
                  <option value="Other" className="bg-canvas">Other</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Device Images (Up to 5)</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  {uploadedUrls.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
                      <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-premium"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {uploadedUrls.length < 5 && (
                    <label className="flex flex-col items-center justify-center aspect-square border-2 border-white/5 border-dashed rounded-xl cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-premium border-white/10 hover:border-brand/30 group">
                      {uploading ? (
                        <div className="animate-spin text-xl text-white/20">⏳</div>
                      ) : (
                        <span className="text-2xl opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-premium">📸</span>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }} />
                    </label>
                  )}
                </div>
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Your Location</label>
                <input {...register('location')} placeholder="City, County" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-premium text-white" />
              </div>
              <button type="submit" className="col-span-1 md:col-span-2 vibrant-gradient text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-premium shadow-xl mt-4">
                Submit Listing
              </button>
            </div>
          </form>
        </div>
      )}

      {/* What's New Section */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-3xl font-black text-white tracking-widest uppercase">What's New</h2>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-brand/50 to-transparent"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {newArrivals.map((listing: Listing) => (
            <div
              key={listing.id}
              onClick={() => setSelectedListing(listing)}
              className="glass-card rounded-[2rem] overflow-hidden border border-white/5 hover:border-brand/30 transition-premium shadow-lg group cursor-pointer"
            >
              <div className="h-64 bg-white/5 flex items-center justify-center relative overflow-hidden">
                {listing.imageUrls && listing.imageUrls.length > 0 ? (
                  <img src={listing.imageUrls[0]} alt={listing.device} className="h-full w-full object-cover group-hover:scale-110 transition-premium duration-700" />
                ) : (
                  <span className="text-5xl group-hover:scale-125 transition-premium">📱</span>
                )}
                <div className="absolute top-4 right-4 glass-card px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand/20 text-brand backdrop-blur-md">
                  {listing.condition}
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-2">{listing.device}</h3>
                <p className="text-white/40 text-sm mb-6 line-clamp-2 leading-relaxed">{listing.description}</p>
                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                  <span className="text-3xl font-black text-brand">${listing.price}</span>
                  <button className="text-xs font-black uppercase tracking-widest text-white/60 hover:text-brand transition-premium underline underline-offset-8">Details →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main List Section */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black text-white tracking-widest uppercase">All Listings</h2>
            <div className="h-[2px] w-20 bg-gradient-to-r from-white/10 to-transparent"></div>
          </div>

          <div className="flex flex-wrap gap-3">
            {['All', 'New', 'Refurbished', 'Used', 'Dead / Unused'].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCondition(c === 'All' ? null : c)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-premium border ${(selectedCondition === c || (c === 'All' && !selectedCondition))
                  ? 'vibrant-gradient text-white border-transparent'
                  : 'glass-card text-white/40 border-white/5 hover:border-white/20'
                  }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {allListings.map((listing: Listing) => (
            <div
              key={listing.id}
              onClick={() => setSelectedListing(listing)}
              className="glass-card rounded-2xl overflow-hidden border border-white/5 hover:border-brand/30 transition-premium hover:shadow-xl p-4 cursor-pointer group"
            >
              <div className="h-40 bg-white/5 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
                {listing.imageUrls && listing.imageUrls.length > 0 ? (
                  <img src={listing.imageUrls[0]} alt={listing.device} className="h-full w-full object-cover rounded-xl group-hover:scale-110 transition-premium duration-700" />
                ) : (
                  <span className="text-3xl">📦</span>
                )}
                <div className="absolute top-2 right-2 glass-card px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-brand/20 text-brand backdrop-blur-md">
                  {listing.condition}
                </div>
              </div>
              <h3 className="font-bold text-white truncate">{listing.device}</h3>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{listing.category || 'General'}</p>
              <div className="flex justify-between items-center">
                <span className="text-xl font-black text-white">${listing.price}</span>
                <button className="text-brand text-[10px] font-black uppercase tracking-widest underline underline-offset-4">View</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Listing Details Modal */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 min-h-screen">
          <div className="absolute inset-0 bg-canvas/80 backdrop-blur-xl" onClick={() => setSelectedListing(null)}></div>
          <div className="glass-card w-full max-w-4xl rounded-[2.5rem] border border-white/10 shadow-premium overflow-hidden relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setSelectedListing(null);
                setActiveImageIndex(0);
              }}
              className="absolute top-8 right-8 text-white/40 hover:text-white transition-premium z-20"
            >
              <span className="text-2xl font-black">✕</span>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 space-y-4">
                <div className="aspect-square bg-white/5 rounded-3xl overflow-hidden border border-white/10 relative group">
                  <img
                    src={selectedListing.imageUrls?.[activeImageIndex] || '/placeholder.png'}
                    alt={selectedListing.device}
                    className="w-full h-full object-cover transition-opacity duration-500"
                  />

                  {selectedListing.imageUrls && selectedListing.imageUrls.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIndex(prev => (prev === 0 ? selectedListing.imageUrls!.length - 1 : prev - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-canvas/40 backdrop-blur-md p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-premium"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setActiveImageIndex(prev => (prev === selectedListing.imageUrls!.length - 1 ? 0 : prev + 1))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-canvas/40 backdrop-blur-md p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-premium"
                      >
                        →
                      </button>
                    </>
                  )}
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {selectedListing.imageUrls?.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`min-w-[80px] h-20 bg-white/5 rounded-xl overflow-hidden border cursor-pointer transition-premium ${activeImageIndex === i ? 'border-brand' : 'border-white/5'}`}
                    >
                      <img src={url} alt={`Thumbnail ${i}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-12 flex flex-col justify-center">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-brand mb-4 block">{selectedListing.category} • {selectedListing.condition}</span>
                <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">{selectedListing.device}</h2>
                <div className="text-white/60 text-lg mb-8 leading-relaxed whitespace-pre-wrap">
                  {selectedListing.description}
                </div>

                <div className="space-y-6 pt-8 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-4xl font-black text-white">${selectedListing.price}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Serial: {selectedListing.serialNumber}</span>
                  </div>

                  <button
                    onClick={() => purchaseMutation.mutate(selectedListing)}
                    disabled={purchaseMutation.isPending}
                    className="w-full vibrant-gradient text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-premium shadow-xl disabled:opacity-50"
                  >
                    {purchaseMutation.isPending ? 'Processing...' : 'Buy Device Now'}
                  </button>
                  <p className="text-center text-[10px] font-bold uppercase tracking-widest text-white/20">
                    * Final purchase subject to technician or shop approval
                  </p>
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
