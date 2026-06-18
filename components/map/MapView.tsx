'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Loader2, MapPin } from 'lucide-react';
import { useCafeStore } from '@/lib/store/cafeStore';
import { fetchNearbyCafes } from '@/lib/overpass';
import { CafeMarker } from './CafeMarker';
import { PUNE_CENTER } from '@/types';

const userIcon = L.divIcon({
  html: `<div style="
    width:16px;height:16px;
    background:#3b82f6;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 0 5px rgba(59,130,246,0.25);
  "></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

async function loadCafes(
  lat: number,
  lng: number,
  setCafes: (cafes: import('@/types').Cafe[]) => void,
  setLoading: (loading: boolean) => void
) {
  setLoading(true);
  try {
    const cafes = await fetchNearbyCafes(lat, lng, 5000);
    setCafes(cafes);
  } catch {
    setCafes([]);
  } finally {
    setLoading(false);
  }
}

function MapController({ onLocationDenied }: { onLocationDenied: () => void }) {
  const map = useMap();
  const { setUserLocation, setCafes, setLoading, setSelectedCafe, setSheetOpen } = useCafeStore();

  useEffect(() => {
    if (!navigator.geolocation) {
      onLocationDenied();
      loadCafes(PUNE_CENTER.center.lat, PUNE_CENTER.center.lng, setCafes, setLoading);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        map.flyTo([loc.lat, loc.lng], 14, { duration: 1.5 });
        await loadCafes(loc.lat, loc.lng, setCafes, setLoading);
      },
      () => {
        // Denied — load real Pune cafés from OSM so the map isn't empty
        onLocationDenied();
        loadCafes(PUNE_CENTER.center.lat, PUNE_CENTER.center.lng, setCafes, setLoading);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [map, setUserLocation, setCafes, setLoading, onLocationDenied]);

  useMapEvents({
    click() {
      setSelectedCafe(null);
      setSheetOpen(false);
    },
  });

  return null;
}

function LocateButton({ onLocated }: { onLocated: () => void }) {
  const map = useMap();
  const { userLocation, setUserLocation, setCafes, setLoading } = useCafeStore();

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        map.flyTo([loc.lat, loc.lng], 15, { duration: 1 });
        onLocated();
        await loadCafes(loc.lat, loc.lng, setCafes, setLoading);
      },
      () => {}
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 148,
        right: 16,
        zIndex: 800,
        pointerEvents: 'auto',
      }}
    >
      <button
        onClick={handleLocate}
        title="Find cafés near me"
        className="w-10 h-10 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-zinc-200 flex items-center justify-center hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
      >
        <LocateFixed
          className="w-4 h-4"
          style={{ color: userLocation ? '#3b82f6' : '#52525b' }}
          strokeWidth={2.5}
        />
      </button>
    </div>
  );
}

export function MapView() {
  const { filteredCafes, setSelectedCafe, userLocation, isLoading } = useCafeStore();
  const [locationDenied, setLocationDenied] = useState(false);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[PUNE_CENTER.center.lat, PUNE_CENTER.center.lng]}
        zoom={PUNE_CENTER.zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <MapController onLocationDenied={() => setLocationDenied(true)} />
        <LocateButton onLocated={() => setLocationDenied(false)} />

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
            zIndexOffset={500}
          />
        )}

        {filteredCafes.map((cafe) => (
          <CafeMarker
            key={cafe.id}
            cafe={cafe}
            onClick={() => setSelectedCafe(cafe)}
          />
        ))}
      </MapContainer>

      {/* Loading pill */}
      {isLoading && (
        <div className="absolute top-[88px] left-1/2 -translate-x-1/2 z-[800] pointer-events-none">
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-sm text-xs font-medium text-zinc-600 px-3.5 py-2 rounded-full shadow-md border border-zinc-200">
            <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
            Finding cafés nearby…
          </div>
        </div>
      )}

      {/* Location denied banner */}
      {locationDenied && !isLoading && (
        <div className="absolute top-[88px] left-1/2 -translate-x-1/2 z-[800] w-[calc(100%-32px)] max-w-sm">
          <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm text-xs text-zinc-600 px-3.5 py-2.5 rounded-2xl shadow-md border border-zinc-200">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span>Showing cafés in Pune. Tap <strong className="text-zinc-800">locate</strong> to use your position.</span>
          </div>
        </div>
      )}
    </div>
  );
}
