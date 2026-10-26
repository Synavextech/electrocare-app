import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearch, Link, useNavigate } from '@tanstack/react-router';
import apiClient from '../utils/apiClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saleSchema } from '../utils/validators';
import useAuth from '../hooks/useAuth';

interface Listing {
  id: string;
  userId?: string;
  device: string;
  description: string;
  price: number;
  piecesAvailable?: number;
  imageUrls?: string[];
  condition: string;
  serialNumber: string;
  mainCategory: string;
  subCategory: string;
  status?: string;
  user?: { id?: string; name: string };
  createdAt: string;
}

const MarketplacePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: '/marketplace' }) as { action?: string };
  const [showForm, setShowForm] = useState(false);
  const [showCustomConfigModal, setShowCustomConfigModal] = useState(false);

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutListing, setCheckoutListing] = useState<Listing | null>(null);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'wallet' | 'mpesa' | 'cod'>('wallet');

  // Custom Device Configurator Form State
  const [customBrand, setCustomBrand] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [customCategory, setCustomCategory] = useState('Mobile Phone');
  const [customStorage, setCustomStorage] = useState('256GB');
  const [customRam, setCustomRam] = useState('8GB');
  const [customCondition, setCustomCondition] = useState('Refurbished');
  const [customBudget, setCustomBudget] = useState('');
  const [customUrgency, setCustomUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [customNotes, setCustomNotes] = useState('');
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [customUploading, setCustomUploading] = useState(false);

  const MARKETPLACE_PHONE_MODELS = ['Samsung', 'Tecno', 'Itel', 'Honor', 'iPhone', 'Redmi'];
  const DEAD_PHONE_DAMAGE_OPTIONS = [
    { label: 'Water damage', icon: '💧' },
    { label: 'Broken screen', icon: '📱' },
    { label: 'Damaged mouthpiece', icon: '🔊' },
    { label: 'I do not know', icon: '❓' },
  ];

  const [selectedPhoneBrand, setSelectedPhoneBrand] = useState('');
  const [manualDeviceInput, setManualDeviceInput] = useState('');
  const [selectedDeadDamage, setSelectedDeadDamage] = useState('');
  const [pastUsabilityNotes, setPastUsabilityNotes] = useState('');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      device: '',
      description: '',
      price: 0,
      piecesAvailable: 1,
      condition: 'Used' as any,
      mainCategory: 'Phones and accessories' as any,
      subCategory: 'Main Devices' as any
    }
  });

  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
  };

  useEffect(() => {
    if (search.action === 'sell-dead') {
      setShowForm(true);
      setValue('condition', 'Unusable');
      setValue('mainCategory', 'Phones and accessories');
      setValue('subCategory', 'Main Devices');
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

  const [listingFeeMethod, setListingFeeMethod] = useState<'wallet' | 'mpesa'>('wallet');
  const [feePhone, setFeePhone] = useState(user?.phone || '');
  const [feeLoading, setFeeLoading] = useState(false);

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => apiClient.get('/wallet').then(res => res.data),
    enabled: !!user,
  });

  const postMutation = useMutation({
    mutationFn: async (data: any) => {
      setFeeLoading(true);
      const res = await apiClient.post('/marketplace', {
        ...data,
        price: Number(data.price),
        imageUrls: uploadedUrls,
      });
      const listing = res.data;

      // Handle KES 20 listing fee for regular users
      if (user?.role !== 'admin' && user?.role !== 'shop') {
        if (listingFeeMethod === 'wallet') {
          await apiClient.post('/payments/listing-fee/wallet', { saleId: listing.id });
        } else {
          if (!feePhone) throw new Error('M-Pesa phone number required for listing fee');
          await apiClient.post('/payments/stkpush', {
            phone: feePhone,
            amount: 20,
            type: 'listing_fee',
            referenceId: listing.id,
            accountReference: 'ListingFee',
            transactionDesc: 'Marketplace Listing Fee',
          });
        }
      }
      return listing;
    },
    onSuccess: () => {
      setFeeLoading(false);
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setShowForm(false);
      reset();
      setUploadedUrls([]);
      if (user?.role !== 'admin' && user?.role !== 'shop' && listingFeeMethod === 'mpesa') {
        alert('Listing submitted! Please check your phone for the M-Pesa STK push prompt to complete the KES 20 listing fee.');
      } else {
        alert('Listing submitted successfully! KES 20 listing fee processed.');
      }
    },
    onError: (err: any) => {
      setFeeLoading(false);
      alert(err.response?.data?.error || err.message || 'Failed to post listing. Please try again.');
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: (data: {
      saleId: string;
      price: number;
      paymentMethod: string;
      phone?: string;
      deliveryAddress?: string;
      fulfillmentMethod: string;
    }) => apiClient.post('/marketplace/purchase', data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setShowCheckoutModal(false);
      setCheckoutListing(null);
      setSelectedListing(null);
      alert(res.data?.message || 'Order placed successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message || 'Checkout failed. Please try again.');
    }
  });

  const handleOpenCheckout = (listing: Listing) => {
    if (!user) {
      alert('Please log in to purchase devices.');
      navigate({ to: '/login' });
      return;
    }
    setCheckoutListing(listing);
    setContactPhone(user.phone || '');
    setShowCheckoutModal(true);
  };

  const destroyListingMutation = useMutation({
    mutationFn: (listingId: string) => apiClient.delete(`/marketplace/${listingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      setSelectedListing(null);
      alert('Listing permanently destroyed and removed from marketplace.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to destroy listing');
    }
  });

  const markSoldMutation = useMutation({
    mutationFn: (listingId: string) => apiClient.patch(`/marketplace/${listingId}/sold`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      setSelectedListing(null);
      alert('Device marked as sold and removed from active marketplace listings.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to mark device as sold');
    }
  });

  const notifyArrivalMutation = useMutation({
    mutationFn: (listingId: string) => apiClient.post(`/marketplace/${listingId}/notify-arrival`),
    onSuccess: (res: any) => {
      alert(res.data?.message || 'Subscribed! We will notify you immediately when this device arrives.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to subscribe to stock arrival alert');
    }
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, piecesAvailable }: { id: string; piecesAvailable: number }) =>
      apiClient.patch(`/marketplace/${id}/stock`, { piecesAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      setSelectedListing(null);
      alert('Stock quantity updated successfully! Any waiting subscribers were notified.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to update stock quantity');
    }
  });

  const customRequestMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/custom-requests', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRequests'] });
      setShowCustomConfigModal(false);
      resetCustomForm();
      alert('Custom device request submitted successfully! Verified technicians and shops will prepare custom quotes.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to submit custom request');
    }
  });

  const handleCustomImageUpload = async (file: File) => {
    if (customImages.length >= 3) return alert('Max 3 reference photos allowed');
    setCustomUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCustomImages(prev => [...prev, res.data.imageUrl]);
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setCustomUploading(false);
    }
  };

  const resetCustomForm = () => {
    setCustomBrand('');
    setCustomModel('');
    setCustomCategory('Mobile Phone');
    setCustomStorage('256GB');
    setCustomRam('8GB');
    setCustomCondition('Refurbished');
    setCustomBudget('');
    setCustomUrgency('medium');
    setCustomNotes('');
    setCustomImages([]);
  };

  const handleCustomRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to submit a custom device request.');
      navigate({ to: '/login' });
      return;
    }
    if (!customBrand || !customModel) {
      return alert('Please enter both device brand and model');
    }

    const title = `${customBrand} ${customModel} (${customRam} RAM / ${customStorage})`;
    const description = `Custom Request for ${customBrand} ${customModel}.\nSpecifications:\n- RAM: ${customRam}\n- Storage: ${customStorage}\n- Preferred Condition: ${customCondition}\n- Additional Requirements: ${customNotes || 'Standard functional device'}`;

    customRequestMutation.mutate({
      title,
      description,
      category: customCategory,
      preferredCondition: customCondition,
      budgetMax: customBudget ? Number(customBudget) : null,
      urgency: customUrgency,
      imageUrls: customImages,
    });
  };


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

  const MARKETPLACE_CATEGORIES = useMemo(() => [
    {
      id: 'phones',
      title: 'Phones and Accessories',
      icon: '📱',
      color: 'from-brand/50',
      border: 'border-brand',
      match: (cat: string) => cat === 'Phones and accessories' || cat === 'Mobile Phone',
      formValue: 'Phones and accessories',
      adminOnly: false,
      deviceDesc: 'Smartphones, feature phones, and certified handsets',
      accessoryDesc: 'Phone cases, fast chargers, screen protectors, cables & audio gear'
    },
    {
      id: 'laptops',
      title: 'Computers & Laptops',
      icon: '💻',
      color: 'from-blue-500/50',
      border: 'border-blue-500',
      match: (cat: string) => cat === 'Computers/Laptops' || cat === 'Laptop',
      formValue: 'Computers/Laptops',
      adminOnly: false,
      deviceDesc: 'Laptops, MacBooks, desktop workstations & ultrabooks',
      accessoryDesc: 'Power adapters, docking stations, RAM, external keyboards, mice & sleeves'
    },
    {
      id: 'security',
      title: 'Security Devices & Accessories',
      icon: '📹',
      color: 'from-amber-500/50',
      border: 'border-amber-500',
      match: (cat: string) => cat === 'Security devices and accessories',
      formValue: 'Security devices and accessories',
      adminOnly: true,
      deviceDesc: 'CCTV surveillance cameras, NVRs, smart door locks, alarm hubs & biometric scanners',
      accessoryDesc: 'Surveillance cables, mounting brackets, power units, door sensors & sirens'
    },
    {
      id: 'gaming',
      title: 'Gaming Devices & Gear',
      icon: '🎮',
      color: 'from-purple-500/50',
      border: 'border-purple-500',
      match: (cat: string) => cat === 'Gaming devices',
      formValue: 'Gaming devices',
      adminOnly: true,
      deviceDesc: 'Next-gen gaming consoles, handhelds, VR systems & gaming rigs',
      accessoryDesc: 'Gaming controllers, headsets, mechanical RGB keyboards, docks & stands'
    },
    {
      id: 'internet',
      title: 'Internet Connection Devices & Services',
      icon: '🌐',
      color: 'from-cyan-500/50',
      border: 'border-cyan-500',
      match: (cat: string) => cat === 'Internet connection devices & services',
      formValue: 'Internet connection devices & services',
      adminOnly: true,
      deviceDesc: 'High-speed Wi-Fi 6 routers, 5G MiFi hotspots, Starlink terminals & modems',
      accessoryDesc: 'CAT6/CAT7 patch cables, high-gain antennas, POE adapters & splitters'
    },
    {
      id: 'flagship',
      title: 'Our Flagship Devices',
      subtitle: 'ElectroCare Custom-Built Devices',
      icon: '⚡',
      color: 'from-emerald-500/50',
      border: 'border-emerald-500',
      match: (cat: string) => cat === 'Our flagship devices' || cat === 'Electrocare flagship devices',
      formValue: 'Our flagship devices',
      adminOnly: true,
      deviceDesc: 'ElectroCare bespoke custom workstations, high-performance builds & tuned systems',
      accessoryDesc: 'Specialized cooling modifications, custom enclosures & precision modules'
    }
  ], []);

  const isMainDevice = (sub: string) => !sub || sub === 'Main Devices' || sub === 'Device';
  const isDeviceAccessory = (sub: string) => sub === 'Device Accessories' || sub === 'Accessory';

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    let items = listings.filter((l: any) => l.status !== 'sold' && l.status !== 'destroyed');

    if (appliedSearch) {
      const q = appliedSearch.toLowerCase();
      items = items.filter((l: any) =>
        (l.device && l.device.toLowerCase().includes(q)) ||
        (l.description && l.description.toLowerCase().includes(q)) ||
        (l.mainCategory && l.mainCategory.toLowerCase().includes(q)) ||
        (l.subCategory && l.subCategory.toLowerCase().includes(q)) ||
        (l.condition && l.condition.toLowerCase().includes(q)) ||
        (l.serialNumber && l.serialNumber.toLowerCase().includes(q))
      );
    }
    return items;
  }, [listings, appliedSearch]);

  const TABS = useMemo(() => [
    { id: 'All', label: 'All Categories', icon: '✨' },
    { id: 'phones', label: 'Phones & Accessories', icon: '📱' },
    { id: 'laptops', label: 'Computers & Laptops', icon: '💻' },
    { id: 'security', label: 'Security Devices', icon: '📹' },
    { id: 'gaming', label: 'Gaming Devices', icon: '🎮' },
    { id: 'internet', label: 'Internet & Services', icon: '🌐' },
    { id: 'flagship', label: 'Our Flagship', icon: '⚡' },
  ], []);

  const displayedCategories = useMemo(() => {
    if (activeTab === 'All') return MARKETPLACE_CATEGORIES;
    return MARKETPLACE_CATEGORIES.filter((c) => c.id === activeTab);
  }, [activeTab, MARKETPLACE_CATEGORIES]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white/30 animate-pulse">
      <div className="text-6xl mb-4">🛒</div>
      <p className="text-xl font-black uppercase tracking-widest">Loading Marketplace...</p>
    </div>
  );

  const getCategoryFallbackIcon = (mainCat: string, subCat: string) => {
    if (isDeviceAccessory(subCat)) return '🔌';
    if (mainCat === 'Computers/Laptops' || mainCat === 'Laptop') return '💻';
    if (mainCat === 'Security devices and accessories') return '📹';
    if (mainCat === 'Gaming devices') return '🎮';
    if (mainCat === 'Internet connection devices & services') return '🌐';
    if (mainCat === 'Our flagship devices' || mainCat === 'Electrocare flagship devices') return '⚡';
    return '📱';
  };

  const ListingCard = ({ listing }: { listing: Listing }) => {
    const isOutOfStock = listing.piecesAvailable !== undefined && listing.piecesAvailable <= 0;
    const isLowStock = listing.piecesAvailable !== undefined && listing.piecesAvailable > 0 && listing.piecesAvailable <= 3;
    const isAccessory = isDeviceAccessory(listing.subCategory);

    return (
      <div
        onClick={() => setSelectedListing(listing)}
        className={`glass-card rounded-2xl overflow-hidden border transition-premium hover:shadow-xl p-4 cursor-pointer group flex flex-col justify-between ${
          isOutOfStock
            ? 'border-white/5 opacity-80 hover:border-rose-500/30 bg-rose-500/[0.02]'
            : 'border-white/5 hover:border-brand/30'
        }`}
      >
        <div>
          <div className="h-40 bg-white/5 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden">
            {listing.imageUrls && listing.imageUrls.length > 0 ? (
              <img src={listing.imageUrls[0]} alt={listing.device} className="h-full w-full object-cover rounded-xl group-hover:scale-110 transition-premium duration-700" />
            ) : (
              <span className="text-4xl">{getCategoryFallbackIcon(listing.mainCategory, listing.subCategory)}</span>
            )}

            {/* Condition Tag */}
            <div className="absolute top-2 right-2 glass-card px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-brand/20 text-brand backdrop-blur-md">
              {listing.condition}
            </div>

            {/* SubCategory Tag */}
            <div className="absolute top-2 left-2 glass-card px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-black/40 text-white/80 backdrop-blur-md">
              {isAccessory ? '🔌 Accessory' : '📦 Device'}
            </div>

            {/* Stock Availability Pill */}
            <div className="absolute bottom-2 left-2">
              {isOutOfStock ? (
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30 backdrop-blur-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-md flex items-center gap-1">
                  🔥 Only {listing.piecesAvailable} left!
                </span>
              ) : listing.piecesAvailable !== undefined ? (
                <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                  📦 {listing.piecesAvailable} in stock
                </span>
              ) : null}
            </div>
          </div>

          <h3 className="font-bold text-white truncate text-sm mb-1">{listing.device}</h3>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            {isAccessory ? 'Device Accessory' : 'Main Device'}
          </p>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          <span className="text-base font-black text-white">KES {listing.price}</span>
          {isOutOfStock ? (
            <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <span>🔔</span> Notify Me
            </span>
          ) : (
            <button className="text-brand text-[10px] font-black uppercase tracking-widest underline underline-offset-4 cursor-pointer">
              View
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-10">
      {/* Hero Section */}
      <section className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-white/10 shadow-premium relative overflow-hidden group text-center md:text-left">
        <div className="absolute inset-0 opacity-10 bg-[url('/check_out.gif')] bg-cover bg-center group-hover:scale-105 transition-premium duration-1000"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-canvas via-canvas/90 to-transparent"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/20 border border-brand/40 text-brand text-xs font-black uppercase tracking-wider mb-4 backdrop-blur-md shadow-lg shadow-brand/10">
            <span className="text-sm">✨</span> Sell your old device to repair your new one
          </div>
          <span className="text-xs font-black uppercase tracking-[0.3em] text-white/50 mb-3 block">Official Marketplace</span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-4 md:mb-6 tracking-tighter leading-tight">
            The Repair <span className="text-brand">Hub.</span>
          </h1>
          <p className="text-white/60 text-base md:text-xl font-medium max-w-2xl mb-8 md:mb-10 leading-relaxed mx-auto md:mx-0">
            Explore verified mobile phones, computers, security systems, gaming gear, internet solutions & custom flagship tech.
          </p>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <button
              onClick={() => setShowForm(!showForm)}
              className="premium-gradient text-white font-black uppercase tracking-widest py-4 px-10 rounded-2xl transition-premium hover:shadow-2xl hover:scale-105 active:scale-95 text-xs sm:text-sm cursor-pointer"
            >
              {showForm ? '❌ Cancel Listing' : '🚀 Sell Something'}
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Product Search Bar */}
      <section className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 shadow-premium max-w-4xl mx-auto -mt-6 relative z-20 backdrop-blur-xl">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search devices, accessories, models, brands, specs..."
              className="w-full pl-11 pr-10 py-3.5 bg-white/5 border border-white/10 rounded-xl outline-none text-white text-xs sm:text-sm placeholder:text-white/30 focus:border-brand/60 focus:ring-2 focus:ring-brand/20 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-sm p-1 rounded-full transition-colors cursor-pointer"
                title="Clear input"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest vibrant-gradient text-white shadow-lg hover:shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>🔎</span>
            <span>Search</span>
          </button>
        </form>

        {appliedSearch && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-xs">
            <span className="text-white/60">
              Found <strong className="text-brand font-bold">{filteredListings.length}</strong> {filteredListings.length === 1 ? 'item' : 'items'} matching "<span className="text-white font-medium">{appliedSearch}</span>"
            </span>
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-brand hover:underline font-bold uppercase tracking-wider text-[11px] cursor-pointer"
            >
              Clear Search Filter ✕
            </button>
          </div>
        )}
      </section>

      {/* Category Navigation Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 max-w-full">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-premium whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'vibrant-gradient text-white shadow-lg'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {showForm && (
        <div className="animate-in slide-in-from-top-4 duration-500">
          <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-10 rounded-[2rem] border border-white/10 shadow-2xl max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/20 border border-brand/40 text-brand text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md">
                <span>♻️</span> Sell your old device to repair your new one
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                {watch('condition') === 'Unusable' ? 'Trade In Dead / Unused Device' : 'List Your Device'}
              </h2>
              <p className="text-white/60 text-xs mt-1 max-w-md mx-auto">
                Turn your idle or damaged electronics into instant wallet points, cash, or discounts toward your next repair.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Main Category</label>
                <div className="relative">
                  <select
                    {...register('mainCategory')}
                    onChange={(e) => {
                      setValue('mainCategory', e.target.value as any);
                      setValue('device', '');
                      setSelectedPhoneBrand('');
                      setManualDeviceInput('');
                    }}
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-white appearance-none cursor-pointer"
                  >
                    <option value="Phones and accessories" className="bg-canvas text-white">📱 Phones and Accessories</option>
                    <option value="Computers/Laptops" className="bg-canvas text-white">💻 Computers / Laptops</option>
                    {user?.role === 'admin' ? (
                      <>
                        <option value="Security devices and accessories" className="bg-canvas text-white">🛡️ Security devices & accessories [Admin Only]</option>
                        <option value="Gaming devices" className="bg-canvas text-white">🎮 Gaming devices [Admin Only]</option>
                        <option value="Internet connection devices & services" className="bg-canvas text-white">🌐 Internet connection devices & services [Admin Only]</option>
                        <option value="Our flagship devices" className="bg-canvas text-white">⚡ Our flagship devices (ElectroCare Custom Built) [Admin Only]</option>
                      </>
                    ) : null}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">▼</div>
                </div>
                {errors.mainCategory && <p className="text-brand text-[10px] font-black uppercase tracking-widest mt-1 ml-1">{errors.mainCategory.message as string}</p>}
                {user?.role !== 'admin' && (
                  <p className="text-[10px] text-white/40 italic ml-1">
                    Specialty categories (Security, Gaming, Internet & Flagship) are managed directly by ElectroCare Administration.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Subcategory</label>
                <div className="relative">
                  <select {...register('subCategory')} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-white appearance-none cursor-pointer">
                    <option value="Main Devices" className="bg-canvas text-white">📦 Main Devices (Primary Hardware Unit)</option>
                    <option value="Device Accessories" className="bg-canvas text-white">🔌 Device Accessories (Peripherals & Add-ons)</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">▼</div>
                </div>
                {errors.subCategory && <p className="text-brand text-[10px] font-black uppercase tracking-widest mt-1 ml-1">{errors.subCategory.message as string}</p>}
              </div>

              {/* Phone Model / Device Name Field */}
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">
                  {(watch('mainCategory') === 'Phones and accessories' || watch('mainCategory') === 'Mobile Phone') && watch('subCategory') !== 'Device Accessories' ? 'Phone Model' : 'Device / Product Name'}
                </label>

                {(watch('mainCategory') === 'Phones and accessories' || watch('mainCategory') === 'Mobile Phone') && watch('subCategory') !== 'Device Accessories' ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        value={selectedPhoneBrand}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedPhoneBrand(val);
                          if (val !== 'manual') {
                            setValue('device', val);
                            setManualDeviceInput('');
                          } else {
                            setValue('device', manualDeviceInput);
                          }
                        }}
                        className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-white appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-canvas text-white">Select Phone Brand / Model...</option>
                        {MARKETPLACE_PHONE_MODELS.map((brand) => (
                          <option key={brand} value={brand} className="bg-canvas text-white">
                            {brand}
                          </option>
                        ))}
                        <option value="manual" className="bg-canvas text-white">✍️ Other / Manual Input...</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">▼</div>
                    </div>

                    {selectedPhoneBrand === 'manual' && (
                      <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
                        <input
                          type="text"
                          value={manualDeviceInput}
                          onChange={(e) => {
                            setManualDeviceInput(e.target.value);
                            setValue('device', e.target.value);
                          }}
                          placeholder="e.g. Tecno Spark 10C, iPhone 14 Pro, Samsung Galaxy A14..."
                          className="w-full px-5 py-3.5 bg-white/5 border border-brand/40 rounded-xl outline-none text-white text-xs placeholder:text-white/30 focus:ring-2 focus:ring-brand"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    {...register('device')}
                    placeholder={
                      watch('subCategory') === 'Device Accessories'
                        ? 'e.g. 65W GaN Fast Charger, Wireless Controller, Starlink Mounting Bracket...'
                        : (watch('mainCategory') === 'Computers/Laptops' || watch('mainCategory') === 'Laptop')
                        ? 'e.g. MacBook Pro M3 16-inch, HP EliteBook 840, Dell XPS 15...'
                        : watch('mainCategory') === 'Security devices and accessories'
                        ? 'e.g. 4K Solar PTZ Camera, Smart Biometric Door Lock, 8CH NVR...'
                        : watch('mainCategory') === 'Gaming devices'
                        ? 'e.g. PlayStation 5 Pro 2TB, ASUS ROG Ally, Custom RTX 4080 Rig...'
                        : watch('mainCategory') === 'Internet connection devices & services'
                        ? 'e.g. Wi-Fi 6 AX3000 Gigabit Router, 5G Portable MiFi Hotspot...'
                        : watch('mainCategory') === 'Our flagship devices'
                        ? 'e.g. ElectroCare Titan Workstation, Bespoke Liquid-Cooled Rig...'
                        : 'e.g. Device or Accessory Name...'
                    }
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-white text-sm"
                  />
                )}
                {errors.device && <p className="text-brand text-[10px] font-black uppercase tracking-widest mt-1 ml-1">{errors.device.message as string}</p>}
              </div>

              {/* Dead Phone Damage Type Options */}
              {watch('condition') === 'Unusable' && (
                <div className="col-span-1 md:col-span-2 space-y-4 p-6 rounded-2xl bg-brand/5 border border-brand/20">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-brand ml-1">
                      Dead / Unused Device Damage Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {DEAD_PHONE_DAMAGE_OPTIONS.map((opt) => {
                        const isSelected = selectedDeadDamage === opt.label;
                        return (
                          <button
                            type="button"
                            key={opt.label}
                            onClick={() => {
                              setSelectedDeadDamage(opt.label);
                              let desc = `Damage: ${opt.label}.`;
                              if (opt.label === 'I do not know' && pastUsabilityNotes) {
                                desc += ` Past Usability: ${pastUsabilityNotes}`;
                              }
                              setValue('description', desc);
                            }}
                            className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                              isSelected
                                ? 'bg-brand/20 border-brand text-brand shadow-md shadow-brand/10 ring-1 ring-brand'
                                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                            }`}
                          >
                            <span className="text-base">{opt.icon}</span>
                            <span className="truncate">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedDeadDamage === 'I do not know' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          Past Usability Description
                        </span>
                        <span className="text-white/40 text-[11px]">How was the device operating before it failed?</span>
                      </div>
                      <textarea
                        value={pastUsabilityNotes}
                        onChange={(e) => {
                          setPastUsabilityNotes(e.target.value);
                          setValue('description', `Damage: I do not know.\nPast Usability Description: ${e.target.value}`);
                        }}
                        placeholder="Describe past usability: How was it working before it died? (e.g. was operating fine until it shut down overnight, battery drained quickly, sudden black screen...)"
                        className="w-full px-5 py-3.5 bg-white/5 border border-cyan-500/40 rounded-xl outline-none text-white text-xs placeholder:text-white/30 h-24 resize-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Description</label>
                <textarea
                  {...register('description')}
                  placeholder="Detail condition, specs, faults, or notes..."
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-white h-32"
                />
                {errors.description && <p className="text-brand text-[10px] font-black uppercase tracking-widest mt-1 ml-1">{errors.description.message as string}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Price (KES)</label>
                <input {...register('price', { valueAsNumber: true })} type="number" min={0} placeholder="0.00" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-white" />
                {errors.price && <p className="text-brand text-[10px] font-black uppercase tracking-widest mt-1 ml-1">{errors.price.message as string}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/40 ml-1">Pieces Available (Stock Volume)</label>
                <input {...register('piecesAvailable', { valueAsNumber: true })} type="number" min="1" defaultValue={1} placeholder="1" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl outline-none text-white" />
                {errors.piecesAvailable && <p className="text-brand text-[10px] font-black uppercase tracking-widest mt-1 ml-1">{errors.piecesAvailable.message as string}</p>}
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
              {user?.role !== 'admin' && user?.role !== 'shop' && (
                <div className="col-span-1 md:col-span-2 glass-card p-6 rounded-2xl border border-brand/30 bg-brand/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏷️</span>
                      <div>
                        <h4 className="text-white font-bold text-sm uppercase tracking-wider">Marketplace Listing Fee</h4>
                        <p className="text-white/40 text-xs">A nominal fee of KES 20.00 is required per verified listing.</p>
                      </div>
                    </div>
                    <span className="text-xl font-black text-brand">KES 20.00</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div
                      onClick={() => setListingFeeMethod('wallet')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        listingFeeMethod === 'wallet'
                          ? 'border-brand bg-brand/10 ring-1 ring-brand'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white">💰 Wallet Balance</span>
                        <span className="text-[10px] font-black text-brand uppercase">
                          Balance: KES {walletData?.balance || 0}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50">Instant automatic deduction from your ElectroCare wallet.</p>
                    </div>

                    <div
                      onClick={() => setListingFeeMethod('mpesa')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        listingFeeMethod === 'mpesa'
                          ? 'border-brand bg-brand/10 ring-1 ring-brand'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-white">🟢 Lipa Na M-Pesa</span>
                        <span className="text-[10px] font-black text-emerald-400 uppercase">STK Push</span>
                      </div>
                      <p className="text-[10px] text-white/50">Prompt sent to your phone for Safaricom PIN entry.</p>
                    </div>
                  </div>

                  {listingFeeMethod === 'mpesa' && (
                    <div className="pt-2 animate-in fade-in">
                      <label className="text-[10px] font-black uppercase text-white/60 block mb-1">
                        M-Pesa Phone Number (Safaricom)
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 0712345678 or 254712345678"
                        value={feePhone}
                        onChange={(e) => setFeePhone(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={postMutation.isPending || feeLoading}
                className="col-span-1 md:col-span-2 vibrant-gradient text-white py-5 rounded-2xl font-black uppercase tracking-widest mt-4 shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                {feeLoading ? 'Processing Listing & Fee...' : 'List Item for Sale (KES 20 Fee)'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dynamic Category Sections */}
      {displayedCategories.map((cat) => {
        const catItems = filteredListings.filter((l: any) => cat.match(l.mainCategory));
        const mainDevices = catItems.filter((l: any) => isMainDevice(l.subCategory));
        const accessories = catItems.filter((l: any) => isDeviceAccessory(l.subCategory));

        // When viewing all categories with search, hide empty category sections
        if (activeTab === 'All' && appliedSearch && catItems.length === 0) {
          return null;
        }

        return (
          <div key={cat.id} className="space-y-10 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-3xl p-3 rounded-2xl bg-white/5 border border-white/10 shadow-md">
                  {cat.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
                      {cat.title}
                    </h2>
                    {cat.adminOnly && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand/20 text-brand border border-brand/40">
                        Admin Curated
                      </span>
                    )}
                  </div>
                  {cat.subtitle && (
                    <p className="text-xs text-brand font-bold uppercase tracking-widest mt-0.5">
                      {cat.subtitle}
                    </p>
                  )}
                </div>
              </div>
              <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-white/20 via-brand/40 to-transparent ml-4"></div>
            </div>

            <div className="space-y-8">
              {/* Section 1: Main Devices */}
              <div>
                <div className="flex items-center justify-between mb-4 border-l-4 border-brand pl-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/90">
                      📦 Main Devices
                    </h3>
                    <p className="text-[10px] text-white/40">{cat.deviceDesc}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                    {mainDevices.length} {mainDevices.length === 1 ? 'Unit' : 'Units'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {mainDevices.length > 0 ? (
                    mainDevices.map((l: any) => <ListingCard key={l.id} listing={l} />)
                  ) : (
                    <div className="col-span-full p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                      <p className="text-white/30 text-xs font-bold uppercase tracking-wider">
                        No main devices currently available in {cat.title}.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Device Accessories */}
              <div>
                <div className="flex items-center justify-between mb-4 border-l-4 border-cyan-500/50 pl-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/90">
                      🔌 Device Accessories
                    </h3>
                    <p className="text-[10px] text-white/40">{cat.accessoryDesc}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                    {accessories.length} {accessories.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {accessories.length > 0 ? (
                    accessories.map((l: any) => <ListingCard key={l.id} listing={l} />)
                  ) : (
                    <div className="col-span-full p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                      <p className="text-white/30 text-xs font-bold uppercase tracking-wider">
                        No device accessories currently available in {cat.title}.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Global No Results Message if search returns 0 items */}
      {filteredListings.length === 0 && (
        <div className="glass-card rounded-[2.5rem] p-12 sm:p-16 text-center border border-white/10 max-w-xl mx-auto space-y-4 animate-in fade-in">
          <div className="text-6xl mb-2">🔍</div>
          <h3 className="text-2xl font-black text-white">No products found</h3>
          <p className="text-white/60 text-sm leading-relaxed">
            {appliedSearch
              ? `No devices or accessories matched your search "${appliedSearch}". Try adjusting your keywords or clearing the filter.`
              : 'There are no active product listings in this category right now.'}
          </p>
          {appliedSearch && (
            <button
              onClick={handleClearSearch}
              className="vibrant-gradient text-white font-bold text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      )}

      {/* Far End of Marketplace: Custom Order & Device Sourcing Section */}
      <section className="glass-card rounded-[2.5rem] p-10 md:p-14 border border-brand/30 shadow-premium relative overflow-hidden mt-16 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 blur-[120px] -mr-48 -mt-48 transition-premium group-hover:bg-brand/20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-black uppercase tracking-widest">
              <span>🎯</span> Custom Device Sourcing & Bespoke Orders
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
              Looking for a specific device or custom spec?
            </h2>
            <p className="text-foreground/70 text-base md:text-lg font-medium leading-relaxed">
              Configure a full custom device request with your desired brand, RAM, storage, condition, and budget. Our verified shops and certified technicians will review your request and submit tailored offers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0">
            <button
              onClick={() => setShowCustomConfigModal(true)}
              className="premium-gradient text-[#03131e] font-black uppercase tracking-widest py-5 px-8 rounded-2xl transition-premium hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <span>⚡</span> Configure Custom Device
            </button>
            <Link
              to="/custom-requests"
              className="glass-card text-brand hover:text-foreground font-black uppercase tracking-widest py-5 px-8 rounded-2xl border border-brand/30 bg-brand/5 transition-premium hover:shadow-2xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-xs text-center cursor-pointer"
            >
              <span>🔍</span> Browse Requests & Offers
            </Link>
          </div>
        </div>
      </section>

      {/* Full Custom Device Configurator Modal */}
      {showCustomConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card max-w-2xl w-full rounded-[2.5rem] border border-brand/30 p-8 md:p-10 shadow-2xl space-y-6 my-8 relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowCustomConfigModal(false)}
              className="absolute top-6 right-6 text-foreground/40 hover:text-foreground text-2xl font-bold p-2 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-[9px] font-black uppercase tracking-widest mb-2">
                <span>🛠️</span> Device Sourcing Configurator
              </div>
              <h2 className="text-3xl font-black text-foreground">Configure Custom Device</h2>
              <p className="text-foreground/60 text-xs mt-1">
                Specify your exact requirements. Verified shops and technicians will submit verified quotes.
              </p>
            </div>

            <form onSubmit={handleCustomRequestSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                    Category *
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border-glass rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="Mobile Phone">Mobile Phone</option>
                    <option value="Laptop">Laptop / MacBook</option>
                    <option value="Tablet">Tablet / iPad</option>
                    <option value="Accessory">Accessory</option>
                    <option value="Other">Specialty Hardware</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apple, Samsung, Dell, Lenovo"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-surface border border-border-glass rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                  Model / Series *
                </label>
                <input
                  type="text"
                  placeholder="e.g. iPhone 15 Pro Max, MacBook Pro 16 M3, ThinkPad X1 Carbon"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-surface border border-border-glass rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                    Memory (RAM)
                  </label>
                  <select
                    value={customRam}
                    onChange={(e) => setCustomRam(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border-glass rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="4GB">4GB</option>
                    <option value="6GB">6GB</option>
                    <option value="8GB">8GB</option>
                    <option value="12GB">12GB</option>
                    <option value="16GB">16GB</option>
                    <option value="32GB">32GB</option>
                    <option value="64GB+">64GB+</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                    Storage Capacity
                  </label>
                  <select
                    value={customStorage}
                    onChange={(e) => setCustomStorage(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border-glass rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="64GB">64GB</option>
                    <option value="128GB">128GB</option>
                    <option value="256GB">256GB</option>
                    <option value="512GB">512GB</option>
                    <option value="1TB">1TB SSD</option>
                    <option value="2TB+">2TB+ SSD</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                    Condition
                  </label>
                  <select
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border-glass rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="New">Brand New</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Used">Used (Good)</option>
                    <option value="Any">Any Condition</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                    Max Target Budget (KES)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    value={customBudget}
                    onChange={(e) => setCustomBudget(e.target.value)}
                    className="w-full px-4 py-3 bg-surface border border-border-glass rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                    Delivery Urgency
                  </label>
                  <select
                    value={customUrgency}
                    onChange={(e) => setCustomUrgency(e.target.value as any)}
                    className="w-full px-4 py-3 bg-surface border border-border-glass rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="high">Immediate (Within 48h)</option>
                    <option value="medium">Standard (Within 1 week)</option>
                    <option value="low">Flexible</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                  Detailed Notes & Specifics
                </label>
                <textarea
                  placeholder="Detail preferred color, battery health threshold (e.g. >85%), included accessories, warranty requirements, etc."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border-glass rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand h-24"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                  Reference Photos (Optional, up to 3)
                </label>
                <div className="flex gap-3 items-center">
                  {customImages.map((url, i) => (
                    <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-border-glass">
                      <img src={url} alt="Reference" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCustomImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg px-1 text-[8px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {customImages.length < 3 && (
                    <label className="w-14 h-14 rounded-xl border border-dashed border-border-glass flex items-center justify-center cursor-pointer hover:bg-surface/50 text-foreground/40 hover:text-brand transition-colors">
                      {customUploading ? '⏳' : '+'}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        disabled={customUploading}
                        onChange={(e) => e.target.files?.[0] && handleCustomImageUpload(e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border-glass">
                <button
                  type="submit"
                  disabled={customRequestMutation.isPending}
                  className="flex-1 premium-gradient text-[#03131e] font-black uppercase tracking-widest py-4 px-6 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-xs cursor-pointer"
                >
                  {customRequestMutation.isPending ? 'Broadcasting Request...' : 'Submit Custom Device Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomConfigModal(false)}
                  className="px-6 py-4 rounded-2xl bg-surface border border-border-glass text-foreground/60 hover:text-foreground font-black uppercase tracking-widest text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
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
                <div className="flex flex-wrap gap-2.5 mb-6">
                  <span className="px-4 py-1.5 bg-brand/20 text-brand rounded-full text-[10px] font-black uppercase tracking-widest">{selectedListing.mainCategory}</span>
                  <span className="px-4 py-1.5 bg-white/10 text-white/80 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {isDeviceAccessory(selectedListing.subCategory) ? '🔌 Device Accessory' : '📦 Main Device'}
                  </span>
                  <span className="px-4 py-1.5 bg-white/10 text-white/60 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedListing.condition}</span>
                  {selectedListing.piecesAvailable !== undefined && selectedListing.piecesAvailable <= 0 ? (
                    <span className="px-4 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      Out of Stock
                    </span>
                  ) : selectedListing.piecesAvailable !== undefined ? (
                    <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest">
                      📦 {selectedListing.piecesAvailable} Units In Stock
                    </span>
                  ) : null}
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter leading-tight">{selectedListing.device}</h2>
                <p className="text-white/50 text-base md:text-lg font-medium leading-relaxed mb-6">{selectedListing.description}</p>

                {selectedListing.piecesAvailable !== undefined && selectedListing.piecesAvailable <= 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-8 space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                      <span>⚠️</span> Inventory Notice
                    </p>
                    <p className="text-xs text-white/70">
                      All units for this model are currently sold out. Tap <strong>"Notify Me on Arrival"</strong> below to get notified as soon as new pieces arrive or are restocked.
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-8 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Market Price</span>
                    <span className="text-3xl md:text-4xl font-black text-white">KES {selectedListing.price}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {Boolean(user && (user.role === 'admin' || user.id === selectedListing.userId || user.id === selectedListing.user?.id)) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const qty = prompt(`Update pieces available for "${selectedListing.device}":`, String(selectedListing.piecesAvailable ?? 1));
                            if (qty !== null && !isNaN(Number(qty))) {
                              updateStockMutation.mutate({ id: selectedListing.id, piecesAvailable: Number(qty) });
                            }
                          }}
                          disabled={updateStockMutation.isPending}
                          className="px-4 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 font-black uppercase tracking-wider text-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>📦</span> Restock ({selectedListing.piecesAvailable ?? 1})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Mark "${selectedListing.device}" as sold? This will immediately remove it from public marketplace listings.`)) {
                              markSoldMutation.mutate(selectedListing.id);
                            }
                          }}
                          disabled={markSoldMutation.isPending}
                          className="px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-black uppercase tracking-wider text-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>✓</span> Mark as Sold
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Permanently destroy and delete listing "${selectedListing.device}" from the marketplace? This action cannot be undone.`)) {
                              destroyListingMutation.mutate(selectedListing.id);
                            }
                          }}
                          disabled={destroyListingMutation.isPending}
                          className="px-5 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-black uppercase tracking-wider text-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>🗑️</span> Destroy Listing
                        </button>
                      </>
                    ) : selectedListing.piecesAvailable !== undefined && selectedListing.piecesAvailable <= 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!user) {
                            alert('Please log in to receive stock arrival alerts.');
                            navigate({ to: '/login' });
                            return;
                          }
                          notifyArrivalMutation.mutate(selectedListing.id);
                        }}
                        disabled={notifyArrivalMutation.isPending}
                        className="vibrant-gradient text-[#03131e] px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-premium cursor-pointer disabled:opacity-50 flex items-center gap-2"
                      >
                        <span>🔔</span> {notifyArrivalMutation.isPending ? 'Subscribing...' : 'Notify Me on Arrival'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenCheckout(selectedListing)}
                        className="premium-gradient text-[#03131e] px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-premium cursor-pointer"
                      >
                        Buy Now • KES {selectedListing.price?.toLocaleString()}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Checkout Modal */}
      {showCheckoutModal && checkoutListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className="relative w-full max-w-xl glass-card rounded-[2.5rem] border border-white/20 p-8 md:p-10 shadow-2xl overflow-hidden my-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 blur-[90px] -mr-20 -mt-20 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand block mb-1">Secure Checkout</span>
                <h3 className="text-2xl font-black text-white tracking-tight">Complete Your Order</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCheckoutModal(false);
                  setCheckoutListing(null);
                }}
                className="w-10 h-10 rounded-full glass-card border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-premium cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Device Summary Card */}
            <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-4 mb-6 bg-white/[0.02]">
              {checkoutListing.imageUrls && checkoutListing.imageUrls[0] ? (
                <img
                  src={checkoutListing.imageUrls[0]}
                  alt={checkoutListing.device}
                  className="w-16 h-16 rounded-xl object-cover border border-white/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-2xl border border-white/10">
                  📱
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-sm truncate">{checkoutListing.device}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/20 text-brand uppercase tracking-wider">
                    {checkoutListing.condition}
                  </span>
                  <span className="text-white/40 text-xs truncate">
                    {checkoutListing.mainCategory}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40 uppercase font-black">Price</p>
                <p className="text-lg font-black text-white">KES {Number(checkoutListing.price).toLocaleString()}</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const deliveryFee = fulfillmentMethod === 'delivery' ? 200 : 0;
                const totalPrice = Number(checkoutListing.price) + deliveryFee;

                if (fulfillmentMethod === 'delivery' && !deliveryAddress.trim()) {
                  alert('Please provide a delivery address.');
                  return;
                }

                if (checkoutPaymentMethod === 'mpesa' && !contactPhone.trim()) {
                  alert('Please enter your M-Pesa phone number.');
                  return;
                }

                if (checkoutPaymentMethod === 'wallet') {
                  const currentBal = Number(walletData?.balance || 0);
                  if (currentBal < totalPrice) {
                    alert(`Insufficient wallet balance (KES ${currentBal.toLocaleString()}). Required: KES ${totalPrice.toLocaleString()}. Please choose M-Pesa or top up your wallet.`);
                    return;
                  }
                }

                checkoutMutation.mutate({
                  saleId: checkoutListing.id,
                  price: totalPrice,
                  paymentMethod: checkoutPaymentMethod,
                  phone: contactPhone.trim(),
                  deliveryAddress: fulfillmentMethod === 'delivery' ? deliveryAddress.trim() : undefined,
                  fulfillmentMethod,
                });
              }}
              className="space-y-6"
            >
              {/* Step 1: Fulfillment Option */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-3">
                  1. Fulfillment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFulfillmentMethod('pickup')}
                    className={`p-4 rounded-2xl border text-left transition-premium cursor-pointer ${
                      fulfillmentMethod === 'pickup'
                        ? 'border-brand bg-brand/10 ring-2 ring-brand/30'
                        : 'border-white/10 glass-card hover:border-white/20'
                    }`}
                  >
                    <div className="text-2xl mb-1">🏬</div>
                    <p className="text-white font-bold text-xs">Walk-in Pickup</p>
                    <p className="text-white/40 text-[10px] mt-0.5">Collect at Hub / Free</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentMethod('delivery')}
                    className={`p-4 rounded-2xl border text-left transition-premium cursor-pointer ${
                      fulfillmentMethod === 'delivery'
                        ? 'border-brand bg-brand/10 ring-2 ring-brand/30'
                        : 'border-white/10 glass-card hover:border-white/20'
                    }`}
                  >
                    <div className="text-2xl mb-1">🚚</div>
                    <p className="text-white font-bold text-xs">Courier Delivery</p>
                    <p className="text-brand font-bold text-[10px] mt-0.5">+ KES 200 Dispatch Fee</p>
                  </button>
                </div>

                {fulfillmentMethod === 'delivery' && (
                  <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                      Delivery Destination & Details
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="e.g. Westlands, Nairobi, Apt 4B, Woodvale Grove"
                      required
                      className="w-full glass-card border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-brand"
                    />
                  </div>
                )}
              </div>

              {/* Step 2: Payment Method */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-3">
                  2. Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutPaymentMethod('wallet')}
                    className={`p-3 rounded-2xl border text-center transition-premium cursor-pointer ${
                      checkoutPaymentMethod === 'wallet'
                        ? 'border-brand bg-brand/10 ring-2 ring-brand/30'
                        : 'border-white/10 glass-card hover:border-white/20'
                    }`}
                  >
                    <div className="text-xl mb-1">💳</div>
                    <p className="text-white font-bold text-[11px]">Wallet</p>
                    <p className="text-emerald-400 font-bold text-[9px] mt-0.5">
                      KES {Number(walletData?.balance || 0).toLocaleString()}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutPaymentMethod('mpesa')}
                    className={`p-3 rounded-2xl border text-center transition-premium cursor-pointer ${
                      checkoutPaymentMethod === 'mpesa'
                        ? 'border-brand bg-brand/10 ring-2 ring-brand/30'
                        : 'border-white/10 glass-card hover:border-white/20'
                    }`}
                  >
                    <div className="text-xl mb-1">📱</div>
                    <p className="text-white font-bold text-[11px]">M-Pesa</p>
                    <p className="text-white/40 text-[9px] mt-0.5">STK PIN Push</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutPaymentMethod('cod')}
                    className={`p-3 rounded-2xl border text-center transition-premium cursor-pointer ${
                      checkoutPaymentMethod === 'cod'
                        ? 'border-brand bg-brand/10 ring-2 ring-brand/30'
                        : 'border-white/10 glass-card hover:border-white/20'
                    }`}
                  >
                    <div className="text-xl mb-1">💵</div>
                    <p className="text-white font-bold text-[11px]">Pay on Arrival</p>
                    <p className="text-white/40 text-[9px] mt-0.5">COD / Walk-in</p>
                  </button>
                </div>

                {checkoutPaymentMethod === 'mpesa' && (
                  <div className="mt-3 space-y-2 animate-in fade-in duration-200">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
                      Safaricom M-Pesa Phone Number
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. 0712345678 or 254712345678"
                      required
                      className="w-full glass-card border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-brand"
                    />
                    <p className="text-[10px] text-brand/80">
                      An M-Pesa prompt will be sent immediately to this phone to enter your PIN.
                    </p>
                  </div>
                )}

                {checkoutPaymentMethod === 'wallet' && (
                  <div className="mt-3 p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-white/70 space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Available Wallet Balance:</span>
                      <span className="text-emerald-400 font-bold text-sm">KES {Number(walletData?.balance || 0).toLocaleString()}</span>
                    </div>
                    {Number(walletData?.balance || 0) < (Number(checkoutListing.price) + (fulfillmentMethod === 'delivery' ? 200 : 0)) ? (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] space-y-2">
                        <p className="font-bold flex items-center gap-1.5">
                          <span>⚠️</span> Insufficient wallet balance for this purchase.
                        </p>
                        <p className="text-white/60">
                          Shortfall: <span className="text-rose-400 font-bold">KES {((Number(checkoutListing.price) + (fulfillmentMethod === 'delivery' ? 200 : 0)) - Number(walletData?.balance || 0)).toLocaleString()}</span>. You can switch to direct M-Pesa payment or top up your wallet.
                        </p>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setCheckoutPaymentMethod('mpesa')}
                            className="px-3 py-1.5 rounded-lg bg-brand text-[#03131e] font-black uppercase tracking-wider text-[10px] hover:brightness-110 transition-premium cursor-pointer"
                          >
                            ⚡ Switch to Direct M-Pesa
                          </button>
                          <Link
                            to="/wallet"
                            className="px-3 py-1.5 rounded-lg glass-card border border-white/10 text-white font-bold text-[10px] hover:border-white/20 transition-premium"
                          >
                            Top Up Wallet →
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <p className="text-emerald-400/80 text-[11px] font-medium">
                        ✓ Sufficient funds. KES {(Number(checkoutListing.price) + (fulfillmentMethod === 'delivery' ? 200 : 0)).toLocaleString()} will be automatically deducted upon checkout.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Order Breakdown */}
              <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-2 bg-white/[0.01]">
                <div className="flex justify-between text-xs text-white/60">
                  <span>Device Item Price</span>
                  <span className="text-white font-medium">KES {Number(checkoutListing.price).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-white/60">
                  <span>Fulfillment ({fulfillmentMethod === 'delivery' ? 'Courier Delivery' : 'Hub Pickup'})</span>
                  <span className="text-white font-medium">
                    {fulfillmentMethod === 'delivery' ? 'KES 200' : 'FREE'}
                  </span>
                </div>
                <div className="h-[1px] bg-white/10 my-2"></div>
                <div className="flex justify-between text-base font-black text-white">
                  <span>Total Amount</span>
                  <span className="text-brand">
                    KES {(Number(checkoutListing.price) + (fulfillmentMethod === 'delivery' ? 200 : 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {(() => {
                const deliveryFee = fulfillmentMethod === 'delivery' ? 200 : 0;
                const totalOrderPrice = Number(checkoutListing.price) + deliveryFee;
                const isInsufficientWallet = checkoutPaymentMethod === 'wallet' && Number(walletData?.balance || 0) < totalOrderPrice;

                return (
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCheckoutModal(false);
                        setCheckoutListing(null);
                      }}
                      className="flex-1 py-4 rounded-2xl glass-card border border-white/10 text-white/70 hover:text-white font-black uppercase tracking-wider text-xs transition-premium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={checkoutMutation.isPending || isInsufficientWallet}
                      className={`flex-2 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-premium cursor-pointer ${
                        isInsufficientWallet
                          ? 'bg-white/10 text-white/30 border border-white/5 cursor-not-allowed'
                          : 'premium-gradient text-[#03131e] hover:scale-105 active:scale-95'
                      } disabled:opacity-50`}
                    >
                      {checkoutMutation.isPending
                        ? 'Processing Order...'
                        : isInsufficientWallet
                          ? 'Insufficient Balance — Top Up or Pay M-Pesa'
                          : `Pay KES ${totalOrderPrice.toLocaleString()}`}
                    </button>
                  </div>
                );
              })()}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
