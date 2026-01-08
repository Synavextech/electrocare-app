import { Link } from '@tanstack/react-router';

const BottomNav = () => {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] glass-card rounded-3xl z-[100] px-6 py-3 animate-in fade-in slide-in-from-bottom-5 duration-500 transition-premium">
      <div className="flex justify-around items-center h-12">
        <Link
          to="/home"
          className="flex flex-col items-center justify-center space-y-1 text-white/60 hover:text-brand transition-premium [&.active]:text-brand [&.active]:scale-110"
        >
          <span className="text-2xl">🏠</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
        </Link>
        <Link
          to="/schedule"
          className="flex flex-col items-center justify-center space-y-1 text-white/60 hover:text-brand transition-premium [&.active]:text-brand [&.active]:scale-110"
        >
          <span className="text-2xl">🔧</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Repair</span>
        </Link>
        <Link
          to="/wallet"
          className="flex flex-col items-center justify-center space-y-1 text-white/60 hover:text-brand transition-premium [&.active]:text-brand [&.active]:scale-110"
        >
          <span className="text-2xl">💰</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Wallet</span>
        </Link>
        <Link
          to="/marketplace"
          className="flex flex-col items-center justify-center space-y-1 text-white/60 hover:text-brand transition-premium [&.active]:text-brand [&.active]:scale-110"
        >
          <span className="text-2xl">🛍️</span>
          <span className="text-[10px] font-bold uppercase tracking-tighter">Market</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;