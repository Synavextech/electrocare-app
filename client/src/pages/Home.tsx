import { Link } from '@tanstack/react-router';
import useAuth from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';

function Home() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => apiClient.get('/users/me/stats').then(res => res.data),
    enabled: !!user,
  });

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section */}
      <section className="glass-card rounded-[2rem] p-10 border border-white/10 shadow-premium relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 blur-[100px] -mr-32 -mt-32 transition-premium group-hover:bg-brand/20"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
            Welcome back, <span className="text-brand">{user?.email?.split('@')[0] || 'Guest'}</span>! 👋
          </h1>
          <p className="text-white/60 text-xl font-medium">What's your plan for today?</p>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { to: '/schedule', icon: '🔧', label: 'Schedule Repair', desc: 'Expert help in minutes.', color: 'brand' },
          { to: '/tracking', icon: '🚚', label: 'Track Repair', desc: 'Real-time status updates.', color: 'accent' },
          { to: '/wallet', icon: '💳', label: 'Wallet', desc: 'Manage funds & rewards.', color: 'brand' },
          { to: '/marketplace', icon: '🛍️', label: 'Marketplace', desc: 'Buy or sell devices.', color: 'accent' },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="group">
            <div className="glass-card p-8 rounded-3xl h-full transition-premium hover:-translate-y-2 hover:shadow-2xl border border-white/5 hover:border-white/20 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-${item.color}/5 blur-3xl -mr-12 -mt-12 group-hover:bg-${item.color}/20 transition-premium`}></div>
              <div className="text-4xl mb-6 transform group-hover:scale-125 transition-premium inline-block">{item.icon}</div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{item.label}</h3>
              <p className="text-white/50 text-sm font-medium leading-relaxed">{item.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[

          { label: 'Total Repairs', value: stats?.repairs || 0, icon: '🔧', color: 'brand' },
          { label: 'Market Listings', value: stats?.listings || 0, icon: '🛍️', color: 'accent' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl border border-white/5 hover:border-white/20 transition-premium group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-${stat.color}/5 blur-3xl -mr-10 -mt-10 group-hover:bg-${stat.color}/10 transition-premium`}></div>
            <div className="text-3xl mb-4 transform group-hover:scale-110 transition-premium">{stat.icon}</div>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
          </div>
        ))}
      </section>



      {/* Recent Activity / Status */}
      <section className="glass-card rounded-[2rem] p-10 border border-white/10 shadow-premium">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-white tracking-tight">Recent Activity</h2>
          <span className="text-xs font-bold uppercase tracking-widest text-brand px-3 py-1 bg-brand/10 rounded-full">Live Updates</span>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-white/20 border-2 border-dashed border-white/5 rounded-[1.5rem] bg-white/[0.02]">
          <div className="text-6xl mb-6">📝</div>
          <p className="text-lg font-bold uppercase tracking-tighter">No recent activity detected</p>
          <Link to="/schedule" className="mt-6 text-brand font-black uppercase tracking-widest text-sm hover:text-brand-vibrant transition-premium underline-offset-8 hover:underline">
            Start a new repair →
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
