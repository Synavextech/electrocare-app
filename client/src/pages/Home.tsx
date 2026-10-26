import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import useAuth from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';

interface RepairItem {
  id: string;
  request_id?: string;
  device_type: string;
  device_model?: string;
  issue: string;
  status: string;
  delivery: boolean;
  cost?: number;
  paymentMethod?: string;
  createdAt: string;
  shop?: { id: string; name: string; location?: string };
  technician?: { id: string; name: string; phone?: string };
  deliveryPersonnel?: { id: string; name: string; phone?: string };
}

function Home() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => apiClient.get('/users/me/stats').then(res => res.data),
    enabled: !!user,
  });

  const { data: repairs, isLoading: repairsLoading } = useQuery<RepairItem[]>({
    queryKey: ['user-repairs'],
    queryFn: () => apiClient.get('/repairs').then(res => Array.isArray(res.data) ? res.data : []),
    enabled: !!user,
    refetchInterval: 12000,
  });

  const allRepairs = repairs || [];
  const activeRepairs = allRepairs.filter(r => ['pending', 'accepted', 'in_progress', 'in_transit', 'assigned'].includes(r.status));
  const completedRepairs = allRepairs.filter(r => ['completed', 'delivered'].includes(r.status));

  const displayedRepairs = filter === 'active'
    ? activeRepairs
    : filter === 'completed'
    ? completedRepairs
    : allRepairs;

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'accepted':
      case 'assigned': return 2;
      case 'in_progress':
      case 'in_transit': return 3;
      case 'completed':
      case 'delivered': return 4;
      default: return 1;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Submitted & Pending Review
          </span>
        );
      case 'accepted':
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Assigned & Accepted
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            🚚 In Transit / Pickup
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-spin" />
            ⚙️ Repair In Progress
          </span>
        );
      case 'completed':
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span>✓</span> Completed & Quality Verified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-surface text-foreground/70 border border-border-glass">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      {/* Welcome Hero Banner */}
      <section className="glass-card rounded-[2.5rem] p-8 md:p-12 border border-brand/20 shadow-premium relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand/10 blur-[100px] -mr-40 -mt-40 transition-premium group-hover:bg-brand/20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-black uppercase tracking-widest mb-3">
              <span>👤</span> Client Account Portal
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-2">
              Welcome back, <span className="text-brand">{user?.name || user?.email?.split('@')[0] || 'Client'}</span>! 👋
            </h1>
            <p className="text-foreground/70 text-base md:text-lg font-medium">
              Track live repair progress, manage device orders, and monitor your wallet rewards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/schedule"
              className="premium-gradient text-[#03131e] font-black uppercase tracking-widest py-3.5 px-6 rounded-2xl text-xs shadow-lg hover:scale-105 active:scale-95 transition-all text-center cursor-pointer"
            >
              + New Repair Request
            </Link>
            <Link
              to="/tracking"
              className="glass-card text-brand hover:text-foreground font-black uppercase tracking-widest py-3.5 px-6 rounded-2xl border border-brand/30 bg-brand/5 text-xs hover:scale-105 active:scale-95 transition-all text-center cursor-pointer"
            >
              Live Fleet Map
            </Link>
          </div>
        </div>
      </section>

      {/* Account Overview Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Active Repairs', value: activeRepairs.length, icon: '⚡', color: 'brand', subtext: 'In progress or pending' },
          { label: 'Completed Repairs', value: completedRepairs.length, icon: '✅', color: 'emerald-400', subtext: 'Successfully resolved' },
          { label: 'Marketplace Listings', value: stats?.listings || 0, icon: '🛍️', color: 'accent', subtext: 'Items on sale' },
          { label: 'Wallet Balance', value: `KES ${stats?.balance || 0}`, icon: '💰', color: 'brand', subtext: `${stats?.points || 0} Reward Points` },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl border border-border-glass hover:border-brand/30 transition-premium group relative overflow-hidden flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-3xl transform group-hover:scale-110 transition-transform">{stat.icon}</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                Live
              </span>
            </div>
            <div>
              <p className="text-foreground/50 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
              <p className="text-foreground/40 text-[10px] mt-1 font-medium">{stat.subtext}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Submitted & In-Progress Repairs Tracking Dashboard */}
      <section className="glass-card rounded-[2.5rem] p-8 md:p-10 border border-border-glass shadow-premium space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-glass pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                My Repair Requests
              </h2>
              <span className="text-xs font-bold uppercase tracking-widest text-brand px-3 py-1 bg-brand/10 border border-brand/20 rounded-full">
                {allRepairs.length} Total
              </span>
            </div>
            <p className="text-foreground/60 text-xs md:text-sm mt-1">
              Real-time monitoring from initial submission through diagnostic, repair, and delivery.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex bg-surface p-1 rounded-2xl border border-border-glass self-start sm:self-auto">
            {(['active', 'completed', 'all'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  filter === tab
                    ? 'premium-gradient text-[#03131e] shadow-md'
                    : 'text-foreground/50 hover:text-foreground'
                }`}
              >
                {tab === 'active' ? `Active (${activeRepairs.length})` : tab === 'completed' ? `Done (${completedRepairs.length})` : `All (${allRepairs.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Repairs List */}
        {repairsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-foreground/40 animate-pulse">
            <div className="text-5xl mb-3">🔧</div>
            <p className="text-sm font-black uppercase tracking-widest">Loading repair tracking details...</p>
          </div>
        ) : displayedRepairs.length > 0 ? (
          <div className="space-y-6">
            {displayedRepairs.map((repair) => {
              const currentStage = getStageIndex(repair.status);

              return (
                <div
                  key={repair.id}
                  className="glass-card p-6 md:p-8 rounded-[2rem] border border-border-glass hover:border-brand/40 transition-premium space-y-6 relative overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-2xl shrink-0">
                        {repair.device_type === 'Laptop' ? '💻' : '📱'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-brand font-mono">
                            {repair.request_id || `#${repair.id.slice(0, 8).toUpperCase()}`}
                          </span>
                          <span className="text-foreground/40 text-xs">•</span>
                          <span className="text-foreground/60 text-xs">
                            {new Date(repair.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-foreground">
                          {repair.device_model || repair.device_type}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start md:self-auto">
                      {getStatusBadge(repair.status)}
                    </div>
                  </div>

                  {/* Visual 4-Stage Progress Timeline */}
                  <div className="pt-2">
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {[
                        { step: 1, title: 'Submitted', desc: 'Received & Queued' },
                        { step: 2, title: 'Assigned', desc: 'Tech/Shop Assigned' },
                        { step: 3, title: 'In Progress', desc: 'Repairing & Testing' },
                        { step: 4, title: 'Completed', desc: 'Ready / Delivered' },
                      ].map((stage) => {
                        const isDone = currentStage >= stage.step;
                        const isCurrent = currentStage === stage.step;

                        return (
                          <div key={stage.step} className="space-y-1">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                isDone
                                  ? 'bg-gradient-to-r from-brand to-brand-vibrant shadow-sm shadow-brand/30'
                                  : 'bg-surface border border-border-glass'
                              }`}
                            />
                            <p
                              className={`text-[10px] font-black uppercase tracking-wider truncate ${
                                isCurrent
                                  ? 'text-brand'
                                  : isDone
                                  ? 'text-foreground'
                                  : 'text-foreground/30'
                              }`}
                            >
                              {stage.title}
                            </p>
                            <p className="text-[9px] text-foreground/40 hidden sm:block truncate">
                              {stage.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Issue & Diagnostics Info */}
                  <div className="p-4 rounded-2xl bg-surface/60 border border-border-glass space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">
                      Reported Issue & Diagnostics
                    </p>
                    <p className="text-xs md:text-sm text-foreground/80 leading-relaxed font-medium">
                      "{repair.issue}"
                    </p>
                  </div>

                  {/* Logistics & Assignment Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs border-t border-border-glass">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40 mb-1">
                        Service Channel
                      </p>
                      <p className="font-bold text-foreground flex items-center gap-1.5">
                        {repair.delivery ? '🚚 Doorstep Delivery' : '🏬 Shop Walk-In'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40 mb-1">
                        Service Assignment
                      </p>
                      <p className="font-bold text-foreground truncate">
                        {repair.shop?.name || repair.technician?.name || (repair.status === 'pending' ? 'Reviewing in Dispatch...' : 'ElectroCare Certified Team')}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40 mb-1">
                        Estimated Cost & Payment
                      </p>
                      <p className="font-black text-brand">
                        {repair.cost ? `KES ${repair.cost}` : 'Quote pending assessment'}
                      </p>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-bold text-foreground/50">
                      {repair.delivery ? 'Live dispatch GPS active' : 'Visit assigned location during open hours'}
                    </span>

                    <div className="flex gap-3">
                      <Link
                        to="/tracking"
                        className="px-5 py-2.5 rounded-xl bg-brand/10 border border-brand/30 text-brand hover:bg-brand hover:text-[#03131e] font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>🚚</span> Live Fleet Tracker
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-foreground/30 border-2 border-dashed border-border-glass rounded-[2rem] bg-surface/30 text-center px-4">
            <div className="text-6xl mb-4">🔧</div>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground/70 mb-2">
              {filter === 'active' ? 'No Active Repairs In Progress' : 'No Repair Records Found'}
            </h3>
            <p className="text-xs text-foreground/50 max-w-md mb-6 leading-relaxed">
              When you book a device repair with doorstep delivery or shop walk-in, live status updates and technician assignments will appear here.
            </p>
            <Link
              to="/schedule"
              className="premium-gradient text-[#03131e] font-black uppercase tracking-widest py-3.5 px-8 rounded-2xl text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Start a new repair →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;

