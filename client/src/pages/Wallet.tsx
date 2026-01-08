import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';
import { AxiosResponse } from 'axios';
import useAuth from '../hooks/useAuth';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  createdAt?: string;
  created_at?: string;
}

const Wallet: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: wallet, isLoading: isWalletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => apiClient.get('/wallet').then((res: AxiosResponse) => res.data),
    enabled: !!user,
  });

  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: () => apiClient.get('/wallet/transactions').then((res: AxiosResponse) => res.data),
    enabled: !!user,
  });


  const redeemMutation = useMutation({
    mutationFn: () => apiClient.post('/wallet/redeem'),
    onSuccess: () => {
      alert('Points redeemed successfully!');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to redeem points');
    }
  });

  const topUpMutation = useMutation({
    mutationFn: (amount: number) => apiClient.post('/wallet/top-up', { amount }),
    onSuccess: () => {
      alert('Wallet topped up successfully!');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Top-up failed');
    }
  });

  const handleTopUp = () => {
    const amount = prompt('Enter top-up amount ($):');
    if (amount && !isNaN(Number(amount))) {
      topUpMutation.mutate(Number(amount));
    }
  };

  if (isWalletLoading || isTransactionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentWallet = wallet || { balance: 0, points: 0 };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Hero Header */}
      <section className="glass-card rounded-[2.5rem] p-12 border border-white/10 shadow-premium relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 blur-[120px] -mr-48 -mt-48 transition-premium"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-brand mb-4 block">Financial Center</span>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter">Your <span className="text-brand">Earnings.</span></h1>
          <p className="text-white/60 text-xl font-medium leading-relaxed">Manage your balance, track rewards, and redeem your points for premium services.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Balances */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-10 rounded-[2.5rem] border border-white/10 shadow-premium relative overflow-hidden group">
            <div className="absolute top-0 right-0 text-6xl opacity-10 group-hover:scale-110 transition-premium p-4">💰</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-1">Total Balance</p>
            <p className="text-5xl font-black text-white tracking-tighter mb-8">$ {Number(currentWallet.balance).toFixed(2)}</p>
            <div className="flex gap-4">
              <button
                onClick={handleTopUp}
                className="flex-1 premium-brand-gradient text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-premium shadow-xl"
              >
                Top Up
              </button>
              <button className="flex-1 glass-card border border-white/10 text-white/40 py-4 rounded-2xl font-black uppercase tracking-widest hover:text-white transition-premium">
                Withdraw
              </button>
            </div>
          </div>

          <div className="glass-card p-10 rounded-[2.5rem] border border-white/10 shadow-premium relative overflow-hidden group">
            <div className="absolute top-0 right-0 text-6xl opacity-10 group-hover:scale-110 transition-premium p-4">🎁</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Reward Points</p>
            <p className="text-5xl font-black text-white tracking-tighter mb-8">{currentWallet.points} <span className="text-xl text-white/20">PTS</span></p>
            <button
              onClick={() => redeemMutation.mutate()}
              disabled={redeemMutation.isPending || currentWallet.points < 100}
              className="w-full glass-card border border-white/5 py-4 rounded-2xl font-black uppercase tracking-widest text-white/60 hover:text-white hover:border-white/20 transition-premium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {redeemMutation.isPending ? 'Processing...' : 'Redeem Now'}
            </button>
            {currentWallet.points < 100 && (
              <p className="text-[8px] text-white/30 mt-2 text-center uppercase tracking-widest font-bold">Min. 100 points required</p>
            )}
          </div>
        </div>

        {/* Transactions / Updates */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-3xl font-black text-white tracking-widest uppercase">Transaction History</h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-brand/30 to-transparent"></div>
          </div>

          {transactions.length === 0 ? (
            <div className="glass-card p-20 rounded-[3rem] border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-white/10">
              <div className="text-6xl mb-6">🏜️</div>
              <p className="font-bold uppercase tracking-[0.2em]">No financial activity yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx, index) => (
                <div key={tx.id || index} className="glass-card p-6 rounded-2xl border border-white/5 flex items-center gap-6 group hover:border-brand/30 transition-premium">
                  <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-xl">
                    {tx.type === 'REF' || tx.type === 'POINTS' || tx.type === 'redeem' ? '🎁' : tx.type === 'top_up' ? '➕' : '💰'}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold tracking-tight">{tx.description || tx.type || 'Transaction'}</p>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                      {new Date(tx.createdAt || tx.created_at || Date.now()).toLocaleDateString()}
                    </p>

                  </div>
                  <div className="text-right">
                    <span className={`font-black ${Number(tx.amount) >= 0 ? 'text-brand' : 'text-red-400'}`}>
                      {Number(tx.amount) >= 0 ? '+' : ''} $ {Math.abs(Number(tx.amount)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
