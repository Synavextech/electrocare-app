import { useState, useRef } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import useAuth from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import TechnicianApplication from './TechnicianApplication';
import useOnClickOutside from '../hooks/useOnClickOutside';

const TopNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [opsOpen, setOpsOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const opsRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(profileRef, () => setProfileOpen(false));
  useOnClickOutside(opsRef, () => setOpsOpen(false));

  const copyReferral = () => {
    if (user?.referral_code) {
      navigator.clipboard.writeText(user.referral_code).catch(console.error);
      alert('Referral code copied!');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 nav-blur border-b border-border-glass flex justify-between items-center px-6 py-3 z-[100] transition-premium shadow-premium">
      {/* Profile (left) */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="text-2xl hover:scale-110 active:scale-95 transition-premium p-2 rounded-full hover:bg-white/10 block"
        >
          👤
        </button>
        {profileOpen && (
          <div className="absolute left-0 mt-3 w-80 glass-card rounded-2xl p-6 text-white animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl border border-white/10">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 glass-card rounded-full border-2 border-brand/20 flex items-center justify-center text-3xl mb-3">
                👤
              </div>
              <h3 className="text-xl font-black tracking-tight">{user?.email?.split('@')[0]}</h3>
              <p className="text-brand text-[10px] font-black uppercase tracking-[0.2em]">{user?.role}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="glass-card p-3 rounded-xl border border-white/5 bg-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Email</p>
                <p className="text-sm font-medium truncate">{user?.email}</p>
              </div>
              <div className="glass-card p-3 rounded-xl border border-white/5 bg-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Phone</p>
                <p className="text-sm font-medium">{user?.phone || 'Not set'}</p>
              </div>
            </div>

            <div
              className="glass-card p-4 rounded-xl border border-dashed border-brand/30 bg-brand/5 mb-6 cursor-pointer active:scale-95 transition-premium text-center"
              onClick={() => { copyReferral(); setProfileOpen(false); }}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-1">Referral Code</p>
              <p className="text-sm font-bold uppercase">{user?.referral_code || '---'}</p>
              <p className="text-[8px] text-white/40 mt-1 uppercase font-bold">Click to copy & invite</p>
            </div>

            <button
              onClick={() => { logout(); setProfileOpen(false); navigate({ to: '/' }); }}
              className="w-full glass-card py-3 rounded-xl text-red-400 font-black uppercase tracking-widest text-[10px] hover:bg-red-500/10 border border-white/5 transition-premium"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      {/* Theme Toggle (center) */}
      <div className="hover:scale-105 transition-premium">
        <ThemeToggle />
      </div>

      {/* Operations Menu (right) */}
      <div className="relative" ref={opsRef}>
        <button onClick={() => setOpsOpen(!opsOpen)} className="text-2xl hover:scale-110 active:scale-95 transition-premium p-2 rounded-full hover:bg-white/10"> ⚙️</button>
        {opsOpen && (
          <div className="absolute right-0 mt-3 w-72 glass-card rounded-xl p-3 text-white overflow-y-auto max-h-[80vh] animate-in fade-in slide-in-from-top-2 duration-300 border border-white/10 shadow-2xl">
            <ul className="space-y-1">
              <li className="px-2 py-3 border-b border-white/5 mb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Platform Operations</h3>
              </li>

              <li className="space-y-1">
                <TechnicianApplication />
                <button
                  onClick={() => { alert('Delivery Application system coming soon!'); setOpsOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-premium text-sm font-bold text-white/80"
                >
                  <span className="text-lg">🚚</span> Apply: Delivery Partner
                </button>
                <Link
                  to="/marketplace"
                  search={{ action: 'sell-dead' }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-premium text-sm font-bold text-white/80"
                  onClick={() => setOpsOpen(false)}
                >
                  <span className="text-lg">💀</span> Sell Dead/Unused Device
                </Link>
              </li>

              <li className="pt-2">
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex justify-between items-center px-4 py-3 bg-brand/10 border border-brand/20 rounded-lg transition-premium hover:bg-brand/20 hover:border-brand/40 group mb-2"
                    onClick={() => setOpsOpen(false)}
                  >
                    <span className="text-sm font-black uppercase tracking-widest">Admin Dashboard</span>
                    <span className="text-xl group-hover:scale-110 transition-premium">🛡️</span>
                  </Link>
                )}
                {user?.role === 'technician' && (
                  <Link
                    to="/technician"
                    className="flex justify-between items-center px-4 py-3 bg-brand/10 border border-brand/20 rounded-lg transition-premium hover:bg-brand/20 hover:border-brand/40 group mb-2"
                    onClick={() => setOpsOpen(false)}
                  >
                    <span className="text-sm font-black uppercase tracking-widest">Tech Dashboard</span>
                    <span className="text-xl group-hover:scale-110 transition-premium">👨‍🔧</span>
                  </Link>
                )}
                {user?.role === 'shop' && (
                  <Link
                    to="/shop"
                    className="flex justify-between items-center px-4 py-3 bg-brand/10 border border-brand/20 rounded-lg transition-premium hover:bg-brand/20 hover:border-brand/40 group mb-2"
                    onClick={() => setOpsOpen(false)}
                  >
                    <span className="text-sm font-black uppercase tracking-widest">Shop Dashboard</span>
                    <span className="text-xl group-hover:scale-110 transition-premium">🏬</span>
                  </Link>
                )}
                {user?.role === 'delivery' && (
                  <Link
                    to="/delivery"
                    className="flex justify-between items-center px-4 py-3 bg-brand/10 border border-brand/20 rounded-lg transition-premium hover:bg-brand/20 hover:border-brand/40 group mb-2"
                    onClick={() => setOpsOpen(false)}
                  >
                    <span className="text-sm font-black uppercase tracking-widest">Fleet Dashboard</span>
                    <span className="text-xl group-hover:scale-110 transition-premium">🚚</span>
                  </Link>
                )}
              </li>

              <li className="pt-2 border-t border-white/5">
                <Link to="/about" className="block px-4 py-2 hover:bg-white/10 rounded-lg transition-premium text-sm font-medium" onClick={() => setOpsOpen(false)}>ℹ️ About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="block px-4 py-2 hover:bg-white/10 rounded-lg transition-premium text-sm font-medium" onClick={() => setOpsOpen(false)}>📞 Contact Us</Link>
              </li>
              <li>
                <Link to="/about" className="block px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg text-xs transition-premium" onClick={() => setOpsOpen(false)}>🛡️ Terms & Privacy</Link>
              </li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default TopNav;
