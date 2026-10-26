import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';
import useAuth from '../hooks/useAuth';

export interface CustomOffer {
  id: string;
  requestId: string;
  sellerId: string;
  price: number;
  condition: string;
  description?: string;
  deliveryDays: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  seller?: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
  };
}

export interface CustomRequest {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  preferredCondition?: string;
  budgetMax?: number;
  urgency?: 'low' | 'medium' | 'high';
  status: 'open' | 'fulfilled' | 'closed';
  imageUrls?: string[];
  offersCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  offers?: CustomOffer[];
}

const CustomRequestPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);

  // Form states for creating a request
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Mobile Phone');
  const [preferredCondition, setPreferredCondition] = useState('Any');
  const [budgetMax, setBudgetMax] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Form states for submitting an offer
  const [offerPrice, setOfferPrice] = useState('');
  const [offerCondition, setOfferCondition] = useState('Used');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerDeliveryDays, setOfferDeliveryDays] = useState('2');

  // Queries
  const { data: requests, isLoading } = useQuery({
    queryKey: ['customRequests', activeTab, selectedCategory],
    queryFn: () => {
      const params: any = {};
      if (activeTab === 'my') params.my = 'true';
      if (selectedCategory !== 'All') params.category = selectedCategory;
      return apiClient.get('/custom-requests', { params }).then((res) => res.data);
    },
  });

  const { data: activeRequestDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['customRequest', selectedRequest?.id],
    queryFn: () => apiClient.get(`/custom-requests/${selectedRequest?.id}`).then((res) => res.data),
    enabled: !!selectedRequest?.id,
  });

  // Mutations
  const createRequestMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/custom-requests', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRequests'] });
      setShowCreateModal(false);
      resetForm();
      alert('Custom request posted! Sellers and technicians can now submit offers.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to post request');
    },
  });

  const submitOfferMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: any }) =>
      apiClient.post(`/custom-requests/${requestId}/offers`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRequest', selectedRequest?.id] });
      queryClient.invalidateQueries({ queryKey: ['customRequests'] });
      setOfferPrice('');
      setOfferDescription('');
      alert('Offer submitted successfully! The buyer has been notified.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to submit offer');
    },
  });

  const acceptOfferMutation = useMutation({
    mutationFn: ({ requestId, offerId }: { requestId: string; offerId: string }) =>
      apiClient.patch(`/custom-requests/${requestId}/offers/${offerId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customRequest', selectedRequest?.id] });
      queryClient.invalidateQueries({ queryKey: ['customRequests'] });
      alert('Offer accepted! You can now proceed to coordinate payment and fulfillment.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || 'Failed to accept offer');
    },
  });

  const handleImageUpload = async (file: File) => {
    if (uploadedUrls.length >= 3) return alert('Max 3 reference photos allowed');
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedUrls((prev) => [...prev, res.data.imageUrl]);
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('Mobile Phone');
    setPreferredCondition('Any');
    setBudgetMax('');
    setUrgency('medium');
    setUploadedUrls([]);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to post a custom device request.');
      navigate({ to: '/login' });
      return;
    }
    if (!title || !description) return alert('Please provide a title and description');

    createRequestMutation.mutate({
      title,
      description,
      category,
      preferredCondition,
      budgetMax: budgetMax ? Number(budgetMax) : null,
      urgency,
      imageUrls: uploadedUrls,
    });
  };

  const handleOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to submit a quote or offer.');
      navigate({ to: '/login' });
      return;
    }
    if (!selectedRequest?.id) return;
    if (!offerPrice || Number(offerPrice) <= 0) return alert('Please enter a valid price');


    submitOfferMutation.mutate({
      requestId: selectedRequest.id,
      data: {
        price: Number(offerPrice),
        condition: offerCondition,
        description: offerDescription,
        deliveryDays: Number(offerDeliveryDays) || 2,
      },
    });
  };

  const filteredRequests = requests?.filter((req: CustomRequest) =>
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-16">
      {/* Hero Header */}
      <section className="glass-card rounded-[2.5rem] p-12 border border-white/10 shadow-premium relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[120px] -mr-48 -mt-48 transition-premium"></div>
        <div className="relative z-10 max-w-3xl">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400 mb-4 block">
            Direct Procurement
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-tight">
            Can't Find It? <span className="text-cyan-400">Request Offers.</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl font-medium leading-relaxed mb-8">
            Looking for a rare motherboard, specific model variant, or discontinued component? Broadcast your request directly to certified shops, technicians, and community sellers.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => {
                if (!user) {
                  alert('Please log in to post a custom device request.');
                  navigate({ to: '/login' });
                  return;
                }
                setShowCreateModal(true);
              }}
              className="premium-gradient text-[#03131e] font-black uppercase tracking-widest py-4 px-8 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-xs flex items-center gap-2 cursor-pointer"
            >
              <span>✨</span> Post Custom Request
            </button>
            <Link
              to="/marketplace"
              className="glass-card text-foreground/70 hover:text-foreground font-bold uppercase tracking-widest py-4 px-8 rounded-2xl border border-border-glass text-xs transition-all"
            >
              ← Back to Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 self-start">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'all' ? 'vibrant-gradient text-white shadow-md' : 'text-white/40 hover:text-white'
            }`}
          >
            All Open Requests
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'my' ? 'vibrant-gradient text-white shadow-md' : 'text-white/40 hover:text-white'
            }`}
          >
            My Requests
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            {['All', 'Mobile Phone', 'Laptop', 'Accessory'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedCategory === cat ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 group">
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-400 outline-none text-white text-xs placeholder:text-white/20"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 text-xs">🔍</span>
          </div>
        </div>
      </div>

      {/* Requests Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-56 rounded-3xl animate-pulse bg-white/5 border border-white/5" />
          ))}
        </div>
      ) : filteredRequests?.length === 0 ? (
        <div className="glass-card p-16 rounded-[2.5rem] border border-dashed border-white/10 text-center flex flex-col items-center">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="text-xl font-bold text-white mb-2">No Requests Found</h3>
          <p className="text-white/40 text-xs max-w-sm mb-6">
            {activeTab === 'my'
              ? "You haven't posted any custom item requests yet."
              : 'Be the first to request an item or spare part from our network of technicians and shops.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="premium-gradient text-white text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg"
          >
            Post a Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests?.map((req: CustomRequest) => (
            <div
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="glass-card p-7 rounded-[2rem] border border-white/10 hover:border-cyan-400/40 transition-premium hover:-translate-y-1 cursor-pointer flex flex-col justify-between group shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-premium"></div>

              <div>
                <div className="flex justify-between items-start gap-2 mb-4">
                  <span className="glass-card px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                    {req.category}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      req.status === 'fulfilled'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : req.urgency === 'high'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {req.status === 'fulfilled' ? '✓ Fulfilled' : `${req.urgency || 'medium'} urgency`}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1">
                  {req.title}
                </h3>
                <p className="text-white/50 text-xs mb-6 line-clamp-2 leading-relaxed">{req.description}</p>
              </div>

              <div>
                <div className="flex items-center justify-between py-3 border-t border-white/5 text-xs">
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-black">Target Budget</p>
                    <p className="text-white font-bold">{req.budgetMax ? `KES ${req.budgetMax.toLocaleString()}` : 'Open Budget'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/40 uppercase font-black">Condition</p>
                    <p className="text-white/80 font-semibold">{req.preferredCondition || 'Any'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <span>💬</span> {req.offersCount || 0} Offers
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
                    View Details →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Details & Offers Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card max-w-3xl w-full rounded-[2.5rem] border border-white/20 p-8 md:p-10 shadow-2xl space-y-8 my-8 relative">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-6 right-6 text-white/40 hover:text-white text-xl font-bold p-2"
            >
              ✕
            </button>

            {/* Request Summary */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="glass-card px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                  {selectedRequest.category}
                </span>
                <span className="text-white/40 text-xs">
                  Posted by {selectedRequest.user?.name || 'Community Member'} • {new Date(selectedRequest.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h2 className="text-3xl font-black text-white">{selectedRequest.title}</h2>
              <p className="text-white/70 text-sm leading-relaxed">{selectedRequest.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-xs">
                <div>
                  <p className="text-white/40 uppercase font-black text-[10px]">Max Budget</p>
                  <p className="text-white font-bold mt-0.5">
                    {selectedRequest.budgetMax ? `KES ${selectedRequest.budgetMax.toLocaleString()}` : 'Negotiable'}
                  </p>
                </div>
                <div>
                  <p className="text-white/40 uppercase font-black text-[10px]">Condition</p>
                  <p className="text-white font-bold mt-0.5">{selectedRequest.preferredCondition || 'Any'}</p>
                </div>
                <div>
                  <p className="text-white/40 uppercase font-black text-[10px]">Urgency</p>
                  <p className="text-white font-bold mt-0.5 capitalize">{selectedRequest.urgency || 'Medium'}</p>
                </div>
                <div>
                  <p className="text-white/40 uppercase font-black text-[10px]">Status</p>
                  <p className="text-cyan-400 font-bold mt-0.5 uppercase">{selectedRequest.status}</p>
                </div>
              </div>
            </div>

            {/* Offers Section */}
            <div className="space-y-6 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span>🏷️</span> Offers Received ({activeRequestDetails?.offers?.length || 0})
                </h3>
              </div>

              {detailsLoading ? (
                <div className="p-8 text-center text-white/40 text-xs">Loading offers...</div>
              ) : activeRequestDetails?.offers?.length === 0 ? (
                <div className="glass-card p-8 rounded-2xl border border-dashed border-white/10 text-center text-white/40 text-xs">
                  No offers submitted yet. Verified shops and technicians will post quotes shortly.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeRequestDetails?.offers?.map((offer: CustomOffer) => {
                    const isOwner = selectedRequest.userId === user?.id;
                    return (
                      <div
                        key={offer.id}
                        className={`p-6 rounded-2xl border transition-all ${
                          offer.status === 'accepted'
                            ? 'border-emerald-500/40 bg-emerald-500/10'
                            : 'border-white/10 glass-card'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                              🏬
                            </div>
                            <div>
                              <p className="text-white font-bold text-sm">
                                {offer.seller?.name || 'Verified Seller'}
                                {offer.seller?.role && (
                                  <span className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/10 text-white/70">
                                    {offer.seller.role}
                                  </span>
                                )}
                              </p>
                              <p className="text-white/40 text-[10px]">
                                Condition: {offer.condition} • Estimated Delivery: {offer.deliveryDays} day(s)
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-black text-white">
                              KES {offer.price.toLocaleString()}
                            </span>

                            {isOwner && selectedRequest.status === 'open' && offer.status === 'pending' && (
                              <button
                                onClick={() =>
                                  acceptOfferMutation.mutate({
                                    requestId: selectedRequest.id,
                                    offerId: offer.id,
                                  })
                                }
                                disabled={acceptOfferMutation.isPending}
                                className="vibrant-gradient text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl shadow-lg hover:scale-105 transition-all"
                              >
                                Accept Offer
                              </button>
                            )}

                            {offer.status === 'accepted' && (
                              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase text-emerald-400 bg-emerald-500/20 border border-emerald-500/30">
                                ✓ Accepted
                              </span>
                            )}
                          </div>
                        </div>

                        {offer.description && (
                          <p className="text-white/60 text-xs mt-2 pl-1 border-l-2 border-cyan-500/30">
                            {offer.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Submit an offer form (for other users/sellers) */}
              {user && selectedRequest.userId !== user.id && selectedRequest.status === 'open' && (
                <form
                  onSubmit={handleOfferSubmit}
                  className="glass-card p-6 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 space-y-4"
                >
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <span>💬</span> Have this item? Submit an Offer
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-white/50 block mb-1">Your Price (KES)</label>
                      <input
                        type="number"
                        placeholder="e.g. 8500"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-white/50 block mb-1">Item Condition</label>
                      <select
                        value={offerCondition}
                        onChange={(e) => setOfferCondition(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-cyan-400"
                      >
                        <option value="New">Brand New</option>
                        <option value="Refurbished">Refurbished</option>
                        <option value="Used">Used (Good Condition)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-white/50 block mb-1">Delivery Days</label>
                      <input
                        type="number"
                        min="1"
                        value={offerDeliveryDays}
                        onChange={(e) => setOfferDeliveryDays(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-white/50 block mb-1">Offer Notes / Warranty info</label>
                    <input
                      type="text"
                      placeholder="e.g. Genuine part tested, includes 30-day replacement warranty"
                      value={offerDescription}
                      onChange={(e) => setOfferDescription(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitOfferMutation.isPending}
                    className="vibrant-gradient text-white font-black uppercase tracking-wider py-3 px-8 rounded-xl text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    {submitOfferMutation.isPending ? 'Submitting...' : 'Submit Quote & Offer'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card max-w-2xl w-full rounded-[2.5rem] border border-brand/30 p-8 md:p-10 shadow-2xl space-y-6 my-8 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 text-foreground/40 hover:text-foreground text-2xl font-bold p-2 transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand block mb-1">
                Broadcasting Request
              </span>
              <h2 className="text-3xl font-black text-foreground">Create Custom Request</h2>
              <p className="text-foreground/60 text-xs mt-1">
                Provide specifications so certified shops and technicians can accurately quote you.
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                  Device / Component Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dell XPS 15 9500 4K OLED Screen Assembly"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-5 py-3.5 bg-surface border border-border-glass rounded-2xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-5 py-3.5 bg-surface border border-border-glass rounded-2xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="Mobile Phone">Mobile Phone</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Accessory">Accessory</option>
                    <option value="Spare Part">Spare Part / Component</option>
                    <option value="Other">Other Electronics</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                    Preferred Condition
                  </label>
                  <select
                    value={preferredCondition}
                    onChange={(e) => setPreferredCondition(e.target.value)}
                    className="w-full px-5 py-3.5 bg-surface border border-border-glass rounded-2xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="Any">Any Condition (Best Offer)</option>
                    <option value="New">Brand New Only</option>
                    <option value="Refurbished">Refurbished / Certified</option>
                    <option value="Used">Used / Working Pull</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                    Maximum Budget (KES)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="w-full px-5 py-3.5 bg-surface border border-border-glass rounded-2xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                    Urgency Level
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full px-5 py-3.5 bg-surface border border-border-glass rounded-2xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="medium">Medium (Standard)</option>
                    <option value="high">High (Urgent Need)</option>
                    <option value="low">Low (Flexible Timeline)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                  Detailed Description & Specifications *
                </label>
                <textarea
                  rows={4}
                  placeholder="Detail the exact model number, part number, year, colors, or specifications you require..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full px-5 py-3.5 bg-surface border border-border-glass rounded-2xl text-foreground text-sm outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              {/* Photos */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block mb-1.5">
                  Reference Photos (Optional, Max 3)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  disabled={uploading}
                  className="text-xs text-foreground/60 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-surface file:border file:border-border-glass file:text-foreground hover:file:bg-surface/80"
                />
                {uploadedUrls.length > 0 && (
                  <div className="flex gap-3 mt-3">
                    {uploadedUrls.map((url, i) => (
                      <img key={i} src={url} alt="Reference" className="w-16 h-16 rounded-xl object-cover border border-border-glass" />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-glass">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-foreground/60 hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRequestMutation.isPending}
                  className="vibrant-gradient text-white font-black uppercase tracking-wider py-3.5 px-8 rounded-xl text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {createRequestMutation.isPending ? 'Publishing...' : 'Publish Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomRequestPage;
