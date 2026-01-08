import React from 'react';
import { Repair, TrackingUpdate } from '../types/models';

interface TrackingInterfaceProps {
  repairs: Repair[];
  updates: TrackingUpdate[];
}

const TrackingInterface: React.FC<TrackingInterfaceProps> = ({ repairs, updates }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {/* Repairs Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-3xl font-black text-white tracking-widest uppercase">Your Repairs</h2>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-brand/50 to-transparent"></div>
        </div>

        {repairs.length === 0 ? (
          <div className="glass-card p-12 rounded-[2rem] border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-white/20">
            <div className="text-5xl mb-4">🛠️</div>
            <p className="font-bold uppercase tracking-tighter">No active repairs</p>
          </div>
        ) : (
          <div className="space-y-6">
            {repairs.map((repair) => (
              <div key={repair.id} className="glass-card p-8 rounded-[2rem] border border-white/5 hover:border-brand/30 transition-premium shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 blur-3xl -mr-12 -mt-12 group-hover:bg-brand/10 transition-premium"></div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-1">Tracking ID</p>
                    <p className="text-lg font-black text-white tracking-tight">{repair.tracking_number}</p>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${repair.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-brand/20 text-brand'
                    }`}>
                    {repair.status}
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Issue</p>
                    <p className="text-white font-medium">{repair.issue}</p>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <span className="text-2xl font-black text-white">$ {repair.cost}</span>
                    <button className="text-xs font-black uppercase tracking-widest text-brand hover:text-brand-vibrant transition-premium underline underline-offset-8">Details →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Updates Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-3xl font-black text-white tracking-widest uppercase">Live Updates</h2>
          <div className="h-[2px] flex-1 bg-gradient-to-r from-accent/50 to-transparent"></div>
        </div>

        {updates.length === 0 ? (
          <div className="glass-card p-12 rounded-[2rem] border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-white/20">
            <div className="text-5xl mb-4">⌛</div>
            <p className="font-bold uppercase tracking-tighter">Waiting for updates</p>
          </div>
        ) : (
          <div className="space-y-4 relative">
            <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-white/5"></div>
            {updates.map((update, index) => (
              <div key={index} className="flex gap-6 relative group">
                <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-2xl z-10 border border-white/10 group-hover:scale-110 transition-premium bg-canvas">
                  🕒
                </div>
                <div className="flex-1 glass-card p-6 rounded-2xl border border-white/5 group-hover:border-accent/30 transition-premium">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">
                    {new Date(update.created_at).toLocaleString()}
                  </p>
                  <p className="text-white font-bold tracking-tight">{update.status_update}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingInterface;
