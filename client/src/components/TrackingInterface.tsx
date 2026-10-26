import React, { useState } from 'react';
import { Repair, TrackingUpdate } from '../types/models';
import GoogleMapView from './GoogleMapView';

interface TrackingInterfaceProps {
  repairs: Repair[];
  purchases?: any[];
  updates: TrackingUpdate[];
}

const TrackingInterface: React.FC<TrackingInterfaceProps> = ({ repairs, purchases = [], updates }) => {
  const [activeTrackingType, setActiveTrackingType] = useState<'repairs' | 'purchases'>(
    repairs.length > 0 ? 'repairs' : purchases.length > 0 ? 'purchases' : 'repairs'
  );

  const [selectedRepairId, setSelectedRepairId] = useState<number | string>(
    repairs.length > 0 ? repairs[0].id : ''
  );

  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>(
    purchases.length > 0 ? purchases[0].id : ''
  );

  const selectedRepair = repairs.find((r) => r.id === selectedRepairId) || repairs[0];
  const selectedPurchase = purchases.find((p) => p.id === selectedPurchaseId) || purchases[0];

  // Coordinates: default shop location (Nairobi CBD)
  const defaultShopLocation = {
    id: 'shop-central',
    name: 'ElectroCare Central Hub',
    address: 'Kenyatta Avenue, Nairobi',
    lat: -1.2833,
    lng: 36.8167,
    rating: 4.8
  };

  const isCourierActive = activeTrackingType === 'repairs'
    ? selectedRepair && (selectedRepair.status === 'in_progress' || (selectedRepair as any).status === 'in_transit')
    : selectedPurchase && (selectedPurchase.shippingStatus === 'in_transit' || selectedPurchase.fulfillmentMethod === 'delivery');

  const activeDeviceTitle = activeTrackingType === 'repairs'
    ? selectedRepair?.device_type || 'Device'
    : selectedPurchase?.sale?.device || 'Purchased Device';

  const activeTrackingCode = activeTrackingType === 'repairs'
    ? selectedRepair?.request_id || selectedRepair?.trackingNumber || selectedRepair?.tracking_number || selectedRepair?.id
    : selectedPurchase?.trackingNumber || `#ORD-${selectedPurchase?.id?.slice(0, 8).toUpperCase()}`;

  // Simulated live courier coordinates between shop and client destination
  const courierLocation = isCourierActive
    ? { lat: -1.2910, lng: 36.8190, title: `Courier delivering ${activeDeviceTitle}` }
    : null;

  // Client destination coordinates
  const clientDestination = {
    lat: -1.2995,
    lng: 36.8245
  };

  const formatShippingStatus = (status?: string) => {
    switch (status) {
      case 'in_transit': return '🚚 In Transit with Courier';
      case 'delivered_to_shop': return '🏬 Ready for Hub Pickup';
      case 'delivered_to_customer': return '✓ Delivered to Customer';
      case 'processing': return '⚙️ Processing & Packaging';
      default: return '📦 Order Confirmed';
    }
  };

  return (
    <div className="space-y-10">
      {/* Type Toggle: Repairs vs Device Purchases */}
      <div className="flex gap-4 p-1.5 glass-card rounded-2xl border border-white/10 max-w-md">
        <button
          onClick={() => setActiveTrackingType('repairs')}
          className={`flex-1 py-3 px-6 rounded-xl text-xs font-black uppercase tracking-wider transition-premium flex items-center justify-center gap-2 cursor-pointer ${
            activeTrackingType === 'repairs'
              ? 'vibrant-gradient text-white shadow-lg'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <span>🛠️</span>
          <span>Repairs ({repairs.length})</span>
        </button>

        <button
          onClick={() => setActiveTrackingType('purchases')}
          className={`flex-1 py-3 px-6 rounded-xl text-xs font-black uppercase tracking-wider transition-premium flex items-center justify-center gap-2 cursor-pointer ${
            activeTrackingType === 'purchases'
              ? 'vibrant-gradient text-white shadow-lg'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <span>📦</span>
          <span>Orders ({purchases.length})</span>
        </button>
      </div>

      {/* Live Interactive Tracking Map */}
      {(selectedRepair || selectedPurchase) && (
        <div className="glass-card p-6 rounded-[2.5rem] border border-white/10 shadow-premium relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🗺️</span>
                <h3 className="text-xl font-black text-white">Live Courier & Fleet Proximity</h3>
                <span className="glass-card px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Telemetry
                </span>
              </div>
              <p className="text-white/50 text-xs mt-1">
                Tracking {activeTrackingType === 'repairs' ? 'repair' : 'purchase order'} #{activeTrackingCode} ({activeDeviceTitle})
              </p>
            </div>

            {courierLocation && (
              <div className="flex items-center gap-3 glass-card px-4 py-2 rounded-2xl border border-white/10 bg-slate-900/60">
                <div className="text-2xl animate-bounce">🛵</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Courier En Route</p>
                  <p className="text-white font-bold text-xs">Approx. 2.1 km • 12 mins ETA</p>
                </div>
              </div>
            )}
          </div>

          <GoogleMapView
            center={courierLocation || defaultShopLocation}
            zoom={13}
            userLocation={clientDestination}
            shops={[defaultShopLocation]}
            deliveryLocation={courierLocation}
            showRoute={!!courierLocation}
            className="w-full h-[320px] md:h-[400px] rounded-[2rem] overflow-hidden relative shadow-inner"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Main List Section (Repairs or Orders) */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-3xl font-black text-white tracking-widest uppercase">
              {activeTrackingType === 'repairs' ? 'Your Repairs' : 'Purchased Devices'}
            </h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-brand/50 to-transparent"></div>
          </div>

          {activeTrackingType === 'repairs' ? (
            repairs.length === 0 ? (
              <div className="glass-card p-12 rounded-[2rem] border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-white/20">
                <div className="text-5xl mb-4">🛠️</div>
                <p className="font-bold uppercase tracking-tighter">No active repairs</p>
              </div>
            ) : (
              <div className="space-y-6">
                {repairs.map((repair) => {
                  const isSelected = selectedRepair?.id === repair.id;
                  const trackingCode = repair.request_id || repair.trackingNumber || repair.tracking_number || repair.id;
                  return (
                    <div
                      key={repair.id}
                      onClick={() => setSelectedRepairId(repair.id)}
                      className={`glass-card p-8 rounded-[2rem] border transition-premium shadow-lg relative overflow-hidden group cursor-pointer ${
                        isSelected ? 'border-brand ring-2 ring-brand/40 bg-brand/5' : 'border-white/5 hover:border-brand/30'
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 blur-3xl -mr-12 -mt-12 group-hover:bg-brand/10 transition-premium"></div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-1">Repair ID</p>
                          <p className="text-lg font-black text-white tracking-tight">{trackingCode}</p>
                        </div>
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          repair.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-brand/20 text-brand'
                        }`}>
                          {repair.status}
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Device & Issue</p>
                          <p className="text-white font-medium">{repair.device_type} — {repair.issue}</p>
                        </div>
                        <div className="flex justify-between items-center pt-6 border-t border-white/5">
                          <span className="text-2xl font-black text-white">
                            {repair.cost ? `KES ${Number(repair.cost).toLocaleString()}` : 'Price pending'}
                          </span>
                          <span className="text-xs font-black uppercase tracking-widest text-brand group-hover:text-brand-vibrant transition-premium flex items-center gap-1">
                            {isSelected ? 'Viewing on Map 📍' : 'Track on Map →'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            purchases.length === 0 ? (
              <div className="glass-card p-12 rounded-[2rem] border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-white/20">
                <div className="text-5xl mb-4">📦</div>
                <p className="font-bold uppercase tracking-tighter">No purchased device orders</p>
              </div>
            ) : (
              <div className="space-y-6">
                {purchases.map((purchase) => {
                  const isSelected = selectedPurchase?.id === purchase.id;
                  const trackingCode = purchase.trackingNumber || `#ORD-${purchase.id.slice(0, 8).toUpperCase()}`;
                  return (
                    <div
                      key={purchase.id}
                      onClick={() => setSelectedPurchaseId(purchase.id)}
                      className={`glass-card p-8 rounded-[2rem] border transition-premium shadow-lg relative overflow-hidden group cursor-pointer ${
                        isSelected ? 'border-brand ring-2 ring-brand/40 bg-brand/5' : 'border-white/5 hover:border-brand/30'
                      }`}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 blur-3xl -mr-12 -mt-12 group-hover:bg-brand/10 transition-premium"></div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-1">Order Tracking Code</p>
                          <p className="text-lg font-black text-white tracking-tight">{trackingCode}</p>
                        </div>
                        <span className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand/20 text-brand border border-brand/30">
                          {formatShippingStatus(purchase.shippingStatus)}
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          {purchase.sale?.imageUrls?.[0] ? (
                            <img src={purchase.sale.imageUrls[0]} alt="Device" className="w-14 h-14 rounded-xl object-cover" />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-2xl">📱</div>
                          )}
                          <div>
                            <p className="text-white font-bold text-base">{purchase.sale?.device || 'Device Item'}</p>
                            <p className="text-white/40 text-xs mt-0.5">
                              Fulfillment: <span className="text-white/70 font-semibold">{purchase.fulfillmentMethod === 'delivery' ? 'Courier Delivery' : 'Hub Walk-in Pickup'}</span>
                            </p>
                            {purchase.deliveryAddress && (
                              <p className="text-white/40 text-[11px] truncate mt-0.5">📍 {purchase.deliveryAddress}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-6 border-t border-white/5">
                          <span className="text-2xl font-black text-white">
                            KES {Number(purchase.price).toLocaleString()}
                          </span>
                          <span className="text-xs font-black uppercase tracking-widest text-brand group-hover:text-brand-vibrant transition-premium flex items-center gap-1">
                            {isSelected ? 'Viewing on Map 📍' : 'Track on Map →'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
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
    </div>
  );
};

export default TrackingInterface;
