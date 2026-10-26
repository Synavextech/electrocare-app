import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';
import { AxiosResponse } from 'axios';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';

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
  const socket = useSocket();

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(200);
  const [topUpPhone, setTopUpPhone] = useState(user?.phone || '');
  const [topUpStatus, setTopUpStatus] = useState<'idle' | 'awaiting_pin' | 'success' | 'failed'>('idle');
  const [topUpMessage, setTopUpMessage] = useState<string>('');
  const pollTimerRef = useRef<any>(null);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawPhone, setWithdrawPhone] = useState(user?.phone || '');

  // Socket listener for instant balance updates (from topups, admin awards, or sales)
  useEffect(() => {
    if (!socket) return;
    const handleWalletUpdate = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (data?.balance !== undefined) {
        setTopUpStatus('success');
        setTopUpMessage('M-Pesa payment received! Wallet credited successfully.');
        setTimeout(() => {
          setShowTopUpModal(false);
          setTopUpStatus('idle');
        }, 3000);
      }
    };

    socket.on('wallet_update', handleWalletUpdate);
    return () => {
      socket.off('wallet_update', handleWalletUpdate);
    };
  }, [socket, queryClient]);

  // Clean polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

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
      alert('Points redeemed successfully! Converted into KES wallet balance.');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to redeem points');
    }
  });

  const pollStkStatus = (checkoutRequestId: string) => {
    let attempts = 0;
    const maxAttempts = 20; // 50 seconds
    setTopUpStatus('awaiting_pin');
    setTopUpMessage('PIN prompt sent to phone. Waiting for M-Pesa PIN input...');

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await apiClient.get(`/payments/status/${checkoutRequestId}`);
        if (res.data?.status === 'completed') {
          clearInterval(pollTimerRef.current);
          setTopUpStatus('success');
          setTopUpMessage('M-Pesa payment confirmed! Your wallet balance has been updated.');
          queryClient.invalidateQueries({ queryKey: ['wallet'] });
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          setTimeout(() => {
            setShowTopUpModal(false);
            setTopUpStatus('idle');
          }, 3000);
        } else if (res.data?.status === 'failed') {
          clearInterval(pollTimerRef.current);
          setTopUpStatus('failed');
          setTopUpMessage('Payment was cancelled or failed on phone.');
        } else if (attempts >= maxAttempts) {
          clearInterval(pollTimerRef.current);
          setTopUpStatus('idle');
          setShowTopUpModal(false);
          queryClient.invalidateQueries({ queryKey: ['wallet'] });
        }
      } catch (err) {
        // Continue polling
      }
    }, 2500);
  };

  const topUpMpesaMutation = useMutation({
    mutationFn: (data: { phone: string; amount: number }) =>
      apiClient.post('/payments/stkpush', {
        phone: data.phone,
        amount: data.amount,
        type: 'wallet_topup',
        accountReference: 'WalletTopUp',
        transactionDesc: 'ElectroCare Wallet Top-up',
      }),
    onSuccess: (res: any) => {
      const checkoutId = res.data?.data?.checkoutRequestId || res.data?.checkoutRequestId;
      if (checkoutId) {
        pollStkStatus(checkoutId);
      } else {
        alert(res.data?.message || 'STK Push initiated! Please enter your PIN on your phone.');
        setShowTopUpModal(false);
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
      }
    },
    onError: (error: any) => {
      setTopUpStatus('failed');
      setTopUpMessage(error.response?.data?.error || error.message || 'M-Pesa STK top-up initiation failed');
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: { amount: number; method: string; phone: string }) =>
      apiClient.post('/wallet/withdraw', data),
    onSuccess: (res: any) => {
      alert(res.data?.message || 'Withdrawal request submitted for Admin approval. Funds will be sent via M-Pesa.');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || error.message || 'Withdrawal request failed');
    }
  });

  if (isWalletLoading || isTransactionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentWallet = wallet || { balance: 0, points: 0 };
  const currentBalance = Number(currentWallet.balance || 0);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Hero Header */}
      <section className="glass-card rounded-[2.5rem] p-12 border border-white/10 shadow-premium relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 blur-[120px] -mr-48 -mt-48 transition-premium"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-black uppercase tracking-[0.3em] text-brand mb-4 block">Financial Center</span>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter">Your <span className="text-brand">Earnings.</span></h1>
          <p className="text-white/60 text-xl font-medium leading-relaxed">Manage your balance, track rewards, and redeem your points for certified services and devices.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Balances */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-10 rounded-[2.5rem] border border-white/10 shadow-premium relative overflow-hidden group">
            <div className="absolute top-0 right-0 text-6xl opacity-10 group-hover:scale-110 transition-premium p-4">💰</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-1">Available Balance</p>
            <p className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-8">
              KES {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setTopUpPhone(user?.phone || '');
                  setShowTopUpModal(true);
                }}
                className="flex-1 premium-gradient text-[#03131e] py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-premium shadow-xl cursor-pointer"
              >
                Top Up
              </button>
              <button
                onClick={() => {
                  setWithdrawPhone(user?.phone || '');
                  setShowWithdrawModal(true);
                }}
                className="flex-1 glass-card border border-white/20 text-white hover:bg-white/10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-premium cursor-pointer"
              >
                Withdraw
              </button>
            </div>
          </div>

          <div className="glass-card p-10 rounded-[2.5rem] border border-white/10 shadow-premium relative overflow-hidden group">
            <div className="absolute top-0 right-0 text-6xl opacity-10 group-hover:scale-110 transition-premium p-4">🎁</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Reward Points</p>
            <p className="text-5xl font-black text-white tracking-tighter mb-8">{currentWallet.points || 0} <span className="text-xl text-white/20">PTS</span></p>
            <button
              onClick={() => redeemMutation.mutate()}
              disabled={redeemMutation.isPending || (currentWallet.points || 0) < 100}
              className="w-full glass-card border border-white/10 py-4 rounded-2xl font-black uppercase tracking-widest text-white/80 hover:text-white hover:border-brand/40 transition-premium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {redeemMutation.isPending ? 'Processing...' : 'Redeem to Cash'}
            </button>
            {(currentWallet.points || 0) < 100 ? (
              <p className="text-[9px] text-white/30 mt-2 text-center uppercase tracking-widest font-bold">Min. 100 points required (100 pts = KES 100)</p>
            ) : (
              <p className="text-[9px] text-emerald-400 mt-2 text-center uppercase tracking-widest font-bold">100 pts converts to KES 100 balance</p>
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
              {transactions.map((tx, index) => {
                const isCredit = tx.type === 'deposit' || tx.type === 'redeem';
                const label =
                  tx.type === 'deposit'
                    ? 'Funds Deposited / Rewarded'
                    : tx.type === 'redeem'
                    ? 'Points Converted'
                    : tx.type === 'withdrawal'
                    ? 'Withdrawal'
                    : 'Payment';

                return (
                  <div key={tx.id || index} className="glass-card p-6 rounded-2xl border border-white/5 flex items-center gap-6 group hover:border-brand/30 transition-premium">
                    <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-xl">
                      {tx.type === 'redeem' ? '🎁' : tx.type === 'deposit' ? '➕' : tx.type === 'withdrawal' ? '📤' : '💳'}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold tracking-tight">{tx.description || label}</p>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                        {new Date(tx.createdAt || tx.created_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`font-black text-sm md:text-base ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : '-'} KES {Math.abs(Number(tx.amount)).toLocaleString()}
                      </span>
                      <p className="text-[10px] uppercase font-bold text-white/30 tracking-wider">
                        {tx.type}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top-Up Modal (M-Pesa STK Push) */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md glass-card rounded-[2.5rem] border border-white/20 p-8 md:p-10 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand block mb-1">Instant Top-up</span>
                <h3 className="text-2xl font-black text-white">Lipa na M-Pesa</h3>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                className="w-10 h-10 rounded-full glass-card border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-premium cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!topUpPhone.trim()) return alert('Please enter your Safaricom phone number.');
                if (topUpAmount <= 0) return alert('Enter a valid top-up amount.');
                topUpMpesaMutation.mutate({ phone: topUpPhone.trim(), amount: topUpAmount });
              }}
              className="space-y-6"
            >
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-3">
                  Select Preset Amount (KES)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[100, 250, 500, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      className={`py-2 rounded-xl border text-xs font-black transition-premium cursor-pointer ${
                        topUpAmount === amt
                          ? 'border-brand bg-brand/20 text-brand'
                          : 'border-white/10 glass-card text-white/60 hover:text-white'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-3 text-white/40 text-xs font-bold">KES</span>
                  <input
                    type="number"
                    min="10"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(Number(e.target.value))}
                    required
                    placeholder="Enter custom amount"
                    className="w-full glass-card border border-white/10 rounded-xl pl-14 pr-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-2">
                  Safaricom M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={topUpPhone}
                  onChange={(e) => setTopUpPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  required
                  className="w-full glass-card border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-brand"
                />
                <p className="text-[10px] text-white/40 mt-1">
                  You will receive an instant STK prompt on your phone to enter your PIN.
                </p>
              </div>

              {topUpStatus === 'awaiting_pin' && (
                <div className="p-4 rounded-2xl bg-brand/10 border border-brand/30 flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center text-xl shrink-0">
                    📱
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-brand">Awaiting M-Pesa PIN</p>
                    <p className="text-[11px] text-white/80">{topUpMessage}</p>
                  </div>
                </div>
              )}

              {topUpStatus === 'success' && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl shrink-0 text-emerald-400">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-400">Payment Confirmed</p>
                    <p className="text-[11px] text-white/80">{topUpMessage}</p>
                  </div>
                </div>
              )}

              {topUpStatus === 'failed' && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-xl shrink-0 text-rose-400">
                    ✕
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-rose-400">Payment Failed</p>
                    <p className="text-[11px] text-white/80">{topUpMessage}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTopUpModal(false);
                    setTopUpStatus('idle');
                  }}
                  className="flex-1 py-4 rounded-2xl glass-card border border-white/10 text-white/70 hover:text-white font-black uppercase tracking-wider text-xs transition-premium cursor-pointer"
                >
                  {topUpStatus === 'awaiting_pin' ? 'Close & Wait' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={topUpMpesaMutation.isPending || topUpStatus === 'awaiting_pin'}
                  className="flex-2 premium-gradient text-[#03131e] py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-premium cursor-pointer disabled:opacity-50"
                >
                  {topUpMpesaMutation.isPending ? 'Sending Prompt...' : topUpStatus === 'awaiting_pin' ? 'Verifying PIN...' : `Pay KES ${topUpAmount.toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md glass-card rounded-[2.5rem] border border-white/20 p-8 md:p-10 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand block mb-1">Fund Withdrawal</span>
                <h3 className="text-2xl font-black text-white">Transfer to M-Pesa</h3>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="w-10 h-10 rounded-full glass-card border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-premium cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amt = Number(withdrawAmount);
                if (isNaN(amt) || amt < 50) return alert('Minimum withdrawal is KES 50.');
                if (amt > currentBalance) return alert(`Maximum withdrawable balance is KES ${currentBalance.toLocaleString()}.`);
                if (!withdrawPhone.trim()) return alert('Please enter your recipient phone number.');

                withdrawMutation.mutate({
                  amount: amt,
                  method: 'mpesa',
                  phone: withdrawPhone.trim()
                });
              }}
              className="space-y-6"
            >
              <div className="glass-card p-4 rounded-xl border border-white/10 text-xs text-white/70 flex justify-between items-center">
                <span>Withdrawable Balance:</span>
                <span className="text-emerald-400 font-bold text-sm">KES {currentBalance.toLocaleString()}</span>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-2">
                  Withdrawal Amount (KES)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-white/40 text-xs font-bold">KES</span>
                  <input
                    type="number"
                    min="50"
                    max={currentBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                    placeholder="Min. 50"
                    className="w-full glass-card border border-white/10 rounded-xl pl-14 pr-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-white/70 block mb-2">
                  Recipient M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  required
                  className="w-full glass-card border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-4 rounded-2xl glass-card border border-white/10 text-white/70 hover:text-white font-black uppercase tracking-wider text-xs transition-premium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawMutation.isPending || currentBalance < 50}
                  className="flex-2 premium-gradient text-[#03131e] py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-premium cursor-pointer disabled:opacity-50"
                >
                  {withdrawMutation.isPending ? 'Submitting...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
