import { useState, useRef } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import useAuth from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
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

  const [copiedType, setCopiedType] = useState<'code' | 'link' | null>(null);

  const refCode = user?.referral_code || user?.referralCode || '';
  const inviteUrl = typeof window !== 'undefined' && refCode 
    ? `${window.location.origin}/login?ref=${refCode}` 
    : `https://electrocare.tech/login?ref=${refCode}`;

  const copyReferralCode = () => {
    if (refCode) {
      navigator.clipboard.writeText(refCode).catch(console.error);
      setCopiedType('code');
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const copyInviteLink = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl).catch(console.error);
      setCopiedType('link');
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return '🛡️ System Administrator';
      case 'shop': return '🏬 Shop Merchant';
      case 'technician': return '👨‍🔧 Certified Technician';
      case 'delivery': return '🚚 Delivery Fleet';
      default: return '👤 Standard Member';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 nav-blur border-b border-border-glass flex justify-between items-center px-6 py-3 z-[100] transition-premium shadow-premium">
      {/* Profile (left) */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => {
            if (!user) {
              navigate({ to: '/login' });
            } else {
              setProfileOpen(!profileOpen);
            }
          }}
          className="text-2xl hover:scale-110 active:scale-95 transition-premium p-2 rounded-full hover:bg-white/10 block"
          title={user ? `${user.name || user.email}` : 'Login / Register'}
        >
          {user ? '👤' : '🔑'}
        </button>

        {profileOpen && user && (
          <div className="absolute left-0 mt-3 w-88 max-w-[92vw] glass-card rounded-2xl p-6 text-foreground animate-in fade-in slide-in-from-top-2 duration-300 shadow-2xl border border-border-glass bg-canvas/95 backdrop-blur-xl">
            {/* Header Avatar & Identity */}
            <div className="flex items-center gap-4 mb-5 pb-4 border-b border-white/10">
              <div className="w-14 h-14 rounded-2xl vibrant-gradient flex items-center justify-center text-2xl shadow-lg shrink-0">
                👤
              </div>
              <div className="overflow-hidden">
                <h3 className="text-base font-black tracking-tight text-foreground truncate">
                  {user.name || user.email?.split('@')[0]}
                </h3>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand/20 text-brand border border-brand/30">
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>

            {/* Profile Credentials Grid */}
            <div className="space-y-3 mb-5 text-xs">
              <div className="glass-card p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <p className="text-[9px] font-black uppercase tracking-widest text-foreground/50 mb-0.5">Email Address</p>
                <p className="text-xs font-semibold text-foreground truncate">{user.email}</p>
              </div>

              <div className="glass-card p-3 rounded-xl border border-white/5 bg-white/[0.02] flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-foreground/50 mb-0.5">Phone Number</p>
                  <p className="text-xs font-semibold text-foreground">{user.phone || 'Not set'}</p>
                </div>
                {!user.phone && (
                  <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Required for M-Pesa</span>
                )}
              </div>

              {/* Wallet Quick Summary */}
              <div className="glass-card p-3 rounded-xl border border-brand/20 bg-brand/5 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-brand mb-0.5">Wallet Balance</p>
                  <p className="text-sm font-black text-foreground">
                    KES {Number(user.wallet_balance || user.wallet?.balance || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-accent mb-0.5">Reward Points</p>
                  <p className="text-sm font-black text-foreground">
                    {user.points || user.wallet?.points || 0} <span className="text-[10px] text-foreground/40 font-bold">PTS</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Invite & Referral Link Generator */}
            <div className="space-y-2 mb-5">
              <div
                className="glass-card p-3.5 rounded-xl border border-dashed border-brand/40 bg-brand/5 cursor-pointer hover:bg-brand/10 transition-premium"
                onClick={copyReferralCode}
                title="Click to copy Referral Code"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand">Referral Code</span>
                  <span className="text-[9px] font-bold text-brand uppercase">
                    {copiedType === 'code' ? '✓ Copied!' : 'Click to Copy'}
                  </span>
                </div>
                <p className="text-sm font-black tracking-wider text-foreground">{refCode || 'GEN-REF'}</p>
              </div>

              <button
                onClick={copyInviteLink}
                className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-foreground font-black text-[10px] uppercase tracking-wider flex items-center justify-between transition-premium cursor-pointer group"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>🔗</span> {copiedType === 'link' ? 'Invite Link Copied to Clipboard!' : 'Copy Full Invite Link'}
                </span>
                <span className="text-brand group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <Link
                to="/wallet"
                onClick={() => setProfileOpen(false)}
                className="py-2.5 rounded-xl glass-card text-foreground text-center font-black uppercase tracking-wider text-[10px] hover:border-brand/40 transition-premium flex items-center justify-center gap-1"
              >
                <span>💳</span> My Wallet
              </Link>
              <button
                onClick={() => { logout(); setProfileOpen(false); navigate({ to: '/' }); }}
                className="py-2.5 rounded-xl glass-card text-rose-400 text-center font-black uppercase tracking-wider text-[10px] hover:bg-rose-500/10 border border-rose-500/20 transition-premium cursor-pointer"
              >
                🚪 Logout
              </button>
            </div>
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
                <Link
                  to="/marketplace"
                  search={{ action: 'sell-dead' }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-premium text-sm font-bold text-white/80"
                  onClick={() => setOpsOpen(false)}
                >
                  <span className="text-lg">💀</span> Sell Dead/Unused Device
                </Link>
              </li>

              <li className="space-y-1">
                <Link
                  to="/custom-requests"
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cyan-500/10 rounded-lg transition-premium text-sm font-bold text-cyan-400"
                  onClick={() => setOpsOpen(false)}
                >
                  <span className="text-lg">🔍</span> Custom Requests & Offers
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
