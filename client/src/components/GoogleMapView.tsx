import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { MapPin, Navigation, Compass, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

declare const google: any;

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#13161c" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#13161c" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#e2e8f0" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#06b6d4" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0f2324" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e2430" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#151922" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#334155" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f8fafc" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#080c14" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }]
  }
];

export interface ShopMarkerData {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  county?: string;
  rating?: number;
  distanceKm?: number;
  services?: string[];
  status?: string;
  statusNote?: string;
}

export interface GoogleMapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  userLocation?: { lat: number; lng: number } | null;
  shops?: ShopMarkerData[];
  selectedShopId?: string | null;
  onSelectShop?: (shop: ShopMarkerData) => void;
  deliveryLocation?: { lat: number; lng: number; title?: string } | null;
  showRoute?: boolean;
  onUserLocationFound?: (loc: { lat: number; lng: number }) => void;
  className?: string;
}

// Calculate Haversine distance in kilometers
const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Resilient Fallback View when Google Maps key is invalid or unavailable
export const FallbackDirectoryView: React.FC<GoogleMapViewProps & { onRetry?: () => void }> = ({
  userLocation,
  shops = [],
  selectedShopId,
  onSelectShop,
  deliveryLocation,
  onUserLocationFound,
  className = "w-full min-h-[360px] rounded-3xl p-6 glass-card border border-white/10 bg-slate-950/90 shadow-2xl relative",
}) => {
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocError("GPS is not supported on this browser.");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (onUserLocationFound) onUserLocationFound(coords);
      },
      (err) => {
        setLocating(false);
        console.warn("GPS lookup note:", err.message);
        setLocError("Location permission denied or timed out.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Sort shops by calculated distance if userLocation is known
  const sortedShops = useMemo(() => {
    if (!userLocation) return shops;
    return [...shops].map((shop) => {
      const dist =
        typeof shop.lat === 'number' && typeof shop.lng === 'number'
          ? calculateDistanceKm(userLocation.lat, userLocation.lng, shop.lat, shop.lng)
          : shop.distanceKm;
      return { ...shop, distanceKm: dist };
    }).sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }, [shops, userLocation]);

  return (
    <div className={className}>
      {/* Top Telemetry & Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h4 className="text-white font-black text-sm uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand" /> Direct Location & Branch Selector
            </h4>
          </div>
          <p className="text-white/40 text-xs mt-1">
            Offline-resilient locator active. Select your preferred branch or pinpoint via GPS.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={locating}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl glass-card border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {locating ? (
              <>
                <span className="animate-spin text-sm">↻</span> Locating...
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-cyan-400" /> Detect GPS
              </>
            )}
          </button>
        </div>
      </div>

      {locError && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{locError}</span>
        </div>
      )}

      {/* Courier/Delivery Live Telemetry Badge (if active in tracking) */}
      {deliveryLocation && (
        <div className="mb-6 p-4 rounded-2xl glass-card border border-emerald-500/30 bg-emerald-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl">
              🛵
            </div>
            <div>
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                Live Courier Telemetry
              </p>
              <p className="text-white font-bold text-xs">
                Active en route ({deliveryLocation.lat.toFixed(4)}, {deliveryLocation.lng.toFixed(4)})
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            GPS Connected
          </span>
        </div>
      )}

      {/* User Position Indicator */}
      {userLocation && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-white/70">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Your GPS Coordinates: <strong className="text-white">{userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</strong></span>
          </div>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Accurate</span>
        </div>
      )}

      {/* Available Branches / Shops Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-white/50 px-1">
          <span>Available Service Centers ({sortedShops.length})</span>
          <span>Tap to Select</span>
        </div>

        {sortedShops.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-white/10 text-white/40 text-xs">
            No service centers found in this region.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {sortedShops.map((shop) => {
              const isSelected = selectedShopId === shop.id;
              return (
                <div
                  key={shop.id}
                  onClick={() => onSelectShop?.(shop)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                    isSelected
                      ? 'bg-brand/15 border-brand shadow-lg shadow-brand/10 ring-1 ring-brand/40'
                      : 'bg-white/[0.03] border-white/10 hover:border-white/30 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="text-white font-bold text-sm flex items-center gap-1.5">
                        {shop.name}
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-brand inline" />}
                      </h5>
                      <p className="text-white/50 text-xs mt-0.5 line-clamp-1">{shop.address}</p>
                    </div>
                    {shop.distanceKm !== undefined && (
                      <span className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white/10 text-white/80 border border-white/10">
                        {shop.distanceKm} km
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-white/40 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {shop.county || 'Verified Branch'}
                    </span>
                    <span
                      className={`font-black uppercase tracking-wider text-[10px] ${
                        isSelected ? 'text-brand' : 'text-white/40'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Choose'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const InnerMap: React.FC<GoogleMapViewProps & { onAuthFail?: () => void }> = ({
  center = { lat: -1.286389, lng: 36.817223 }, // Default: Nairobi CBD
  zoom = 12,
  userLocation,
  shops = [],
  selectedShopId,
  onSelectShop,
  deliveryLocation,
  showRoute = false,
  onUserLocationFound,
  className = "w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl relative",
  onAuthFail,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || map) return;

    try {
      if (typeof google === 'undefined' || !google.maps || !google.maps.Map) {
        return;
      }

      const initialMap = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: DARK_MAP_STYLE,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMap(initialMap);
    } catch (err) {
      console.warn('[GoogleMapView] Map initialization caught error:', err);
      if (onAuthFail) onAuthFail();
    }
  }, [mapRef, map]);

  // Handle Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocating(false);
        if (map) {
          map.panTo(coords);
          map.setZoom(13);
        }
        if (onUserLocationFound) {
          onUserLocationFound(coords);
        }
      },
      (err) => {
        setLocating(false);
        console.warn("Geolocation warning:", err.message);
        setLocError("Unable to retrieve GPS location. Please allow location permissions.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Render Markers and Routes
  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // 1. User Marker
    if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
      const userMarker = new google.maps.Marker({
        position: userLocation,
        map,
        title: "Your Location",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#06b6d4",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
      });
      markersRef.current.push(userMarker);
      bounds.extend(userLocation);
      hasPoints = true;
    }

    // 2. Delivery / Courier Marker
    if (deliveryLocation && typeof deliveryLocation.lat === 'number' && typeof deliveryLocation.lng === 'number') {
      const courierMarker = new google.maps.Marker({
        position: deliveryLocation,
        map,
        title: deliveryLocation.title || "Courier Location",
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#10b981",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          rotation: 45,
        },
      });
      markersRef.current.push(courierMarker);
      bounds.extend(deliveryLocation);
      hasPoints = true;
    }

    // 3. Shop Markers
    shops.forEach((shop) => {
      if (typeof shop.lat !== 'number' || typeof shop.lng !== 'number') return;

      const isSelected = selectedShopId === shop.id;
      const marker = new google.maps.Marker({
        position: { lat: shop.lat, lng: shop.lng },
        map,
        title: shop.name,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: isSelected ? 8 : 6,
          fillColor: isSelected ? "#3b82f6" : "#f59e0b",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: isSelected ? 3 : 1.5,
        },
        zIndex: isSelected ? 999 : 1,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #0f172a; font-family: sans-serif; padding: 6px; max-width: 200px;">
            <p style="font-weight: 800; font-size: 13px; margin: 0 0 4px 0;">${shop.name}</p>
            <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">${shop.address}</p>
            ${shop.distanceKm ? `<p style="font-size: 11px; font-weight: 600; color: #0284c7; margin: 0;">${shop.distanceKm} km away</p>` : ''}
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
        if (onSelectShop) {
          onSelectShop(shop);
        }
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: shop.lat, lng: shop.lng });
      hasPoints = true;
    });

    // 4. Draw Route Polyline
    if (showRoute && userLocation && deliveryLocation) {
      const line = new google.maps.Polyline({
        path: [deliveryLocation, userLocation],
        geodesic: true,
        strokeColor: "#10b981",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        icons: [{
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 3, fillColor: "#10b981", fillOpacity: 1 },
          offset: "100%",
        }],
      });
      line.setMap(map);
      polylineRef.current = line;
    }

    if (hasPoints && (!userLocation || shops.length > 0)) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  }, [map, userLocation, deliveryLocation, shops, selectedShopId, showRoute]);

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Map Floating Header Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="glass-card px-4 py-2.5 rounded-2xl border border-white/20 bg-slate-950/80 hover:bg-slate-900/90 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl hover:border-brand transition-all backdrop-blur-md cursor-pointer"
        >
          {locating ? (
            <>
              <span className="animate-spin text-sm">↻</span>
              <span>Locating...</span>
            </>
          ) : (
            <>
              <span className="text-cyan-400 text-sm">🎯</span>
              <span>Locate Me</span>
            </>
          )}
        </button>

        {locError && (
          <div className="glass-card px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-950/80 text-amber-300 text-[10px] font-semibold max-w-xs text-right">
            {locError}
          </div>
        )}
      </div>

      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 z-10 glass-card px-3 py-2 rounded-xl border border-white/10 bg-slate-950/80 backdrop-blur-md flex items-center gap-3 text-[10px] text-white/70">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-sm"></span>
          <span>You</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm"></span>
          <span>Shop</span>
        </div>
        {deliveryLocation && (
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm"></span>
            <span>Courier</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const GoogleMapView: React.FC<GoogleMapViewProps> = (props) => {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  const [authFailed, setAuthFailed] = useState(false);

  // Intercept Google Maps authorization failure globally to prevent broken UI
  useEffect(() => {
    const originalAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('[Google Maps] Detected InvalidKeyMapError / gm_authFailure. Activating resilient fallback directory view.');
      setAuthFailed(true);
      if (typeof originalAuthFailure === 'function') {
        try { originalAuthFailure(); } catch (e) {}
      }
    };

    const handleWindowError = (e: ErrorEvent) => {
      if (e.message && (e.message.includes('Google Maps') || e.message.includes('InvalidKeyMapError'))) {
        setAuthFailed(true);
      }
    };

    window.addEventListener('error', handleWindowError);

    return () => {
      (window as any).gm_authFailure = originalAuthFailure;
      window.removeEventListener('error', handleWindowError);
    };
  }, []);

  // If no API key configured, or key authentication failed (InvalidKeyMapError), render rich fallback directory
  if (!apiKey || apiKey === 'YOUR_API_KEY' || authFailed) {
    return <FallbackDirectoryView {...props} />;
  }

  const renderStatus = (status: Status): React.ReactElement => {
    switch (status) {
      case Status.LOADING:
        return (
          <div className="w-full h-[360px] rounded-3xl glass-card flex flex-col items-center justify-center text-white/40 border border-white/10 bg-slate-900/50 animate-pulse">
            <div className="text-4xl mb-3 animate-spin">🧭</div>
            <p className="text-xs font-black uppercase tracking-widest">Loading Google Maps Telemetry...</p>
          </div>
        );
      case Status.FAILURE:
        return <FallbackDirectoryView {...props} />;
      default:
        return <div className="w-full h-[360px]" />;
    }
  };

  return (
    <Wrapper apiKey={apiKey} render={renderStatus} libraries={['places', 'geometry']}>
      <InnerMap {...props} onAuthFail={() => setAuthFailed(true)} />
    </Wrapper>
  );
};

export default GoogleMapView;
