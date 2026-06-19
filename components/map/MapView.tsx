'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Loader2, MapPin } from 'lucide-react';
import { useCafeStore } from '@/lib/store/cafeStore';
import { fetchNearbyCafes } from '@/lib/overpass';
import { setMapRef, getMapRef } from '@/lib/mapRef';
import { createClient } from '@/lib/supabase/client';
import { CafeMarker } from './CafeMarker';
import { PUNE_CENTER } from '@/types';
import { Cafe } from '@/types';

const FALLBACK_HOURS = {
  monday:    { open: '08:00', close: '22:00', closed: false },
  tuesday:   { open: '08:00', close: '22:00', closed: false },
  wednesday: { open: '08:00', close: '22:00', closed: false },
  thursday:  { open: '08:00', close: '22:00', closed: false },
  friday:    { open: '08:00', close: '23:00', closed: false },
  saturday:  { open: '09:00', close: '23:00', closed: false },
  sunday:    { open: '09:00', close: '21:00', closed: false },
};

const mean = (arr: number[]) =>
  arr.length ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : null;

async function mergeSupabaseRatings(cafes: Cafe[]): Promise<Cafe[]> {
  try {
    const supabase = createClient();

    // 1. Get Supabase café rows for our OSM IDs (+ any extra reviewed cafés)
    const { data: cafeRows } = await supabase
      .from('cafes')
      .select('id, osm_id, name, lat, lng, address, neighborhood, amenities, noise_level, power_outlets, price_range, opening_hours');

    if (!cafeRows?.length) return cafes;

    const osmToDbId = new Map(cafeRows.map((r) => [r.osm_id, r.id]));
    const dbToOsmId = new Map(cafeRows.map((r) => [r.id,     r.osm_id]));
    const dbIdSet   = new Set(cafeRows.map((r) => r.id));

    // 2. Compute fresh aggregates straight from the reviews table
    const { data: reviews } = await supabase
      .from('reviews')
      .select('cafe_id, rating, wifi_rating, noise_rating, power_rating')
      .in('cafe_id', Array.from(dbIdSet));

    type Agg = { count: number; ratings: number[]; wifi: number[]; noise: number[]; power: number[] };
    const aggByDbId = new Map<string, Agg>();

    for (const r of reviews ?? []) {
      if (!aggByDbId.has(r.cafe_id))
        aggByDbId.set(r.cafe_id, { count: 0, ratings: [], wifi: [], noise: [], power: [] });
      const a = aggByDbId.get(r.cafe_id)!;
      a.count++;
      if (r.rating      != null) a.ratings.push(r.rating);
      if (r.wifi_rating != null) a.wifi.push(r.wifi_rating);
      if (r.noise_rating != null) a.noise.push(r.noise_rating);
      if (r.power_rating != null) a.power.push(r.power_rating);
    }

    // osm_id → computed aggregate
    const osmAgg = new Map(
      Array.from(aggByDbId.entries()).map(([dbId, a]) => [
        dbToOsmId.get(dbId)!,
        { count: a.count, rating: mean(a.ratings), wifi: mean(a.wifi), noise: mean(a.noise), power: mean(a.power) },
      ])
    );

    // 3. Overlay onto existing OSM cafés
    const osmIdSet = new Set(cafes.map((c) => c.id));
    const merged   = cafes.map((c) => {
      const agg = osmAgg.get(c.id);
      if (!agg) return c;
      return {
        ...c,
        rating:           agg.rating ?? 0,
        review_count:     agg.count,
        avg_wifi_rating:  agg.wifi,
        avg_noise_rating: agg.noise,
        avg_power_rating: agg.power,
      };
    });

    // 4. Rescue reviewed cafés that were filtered out of OSM results
    const now = new Date().toISOString();
    const rescued: Cafe[] = cafeRows
      .filter((r) => !osmIdSet.has(r.osm_id) && osmAgg.has(r.osm_id) && r.lat != null && r.lng != null)
      .map((r) => {
        const agg = osmAgg.get(r.osm_id)!;
        return {
          id:            r.osm_id,
          name:          r.name,
          description:   '',
          address:       r.address      || '',
          neighborhood:  r.neighborhood || '',
          lat:           r.lat,
          lng:           r.lng,
          amenities:     r.amenities    || [],
          noise_level:   r.noise_level  || 'moderate',
          power_outlets: r.power_outlets || 'none',
          price_range:   r.price_range  || 2,
          opening_hours: r.opening_hours || FALLBACK_HOURS,
          rating:           agg.rating ?? 0,
          review_count:     agg.count,
          wifi_speed_mbps:  null,
          avg_wifi_rating:  agg.wifi,
          avg_noise_rating: agg.noise,
          avg_power_rating: agg.power,
          images:     [],
          phone:      null,
          website:    null,
          created_at: now,
          updated_at: now,
        };
      });

    return [...merged, ...rescued];
  } catch {
    return cafes;
  }
}

// Sheet sits bottom-14 (56px) above the nav; add that offset to each snap
const SNAP_BOTTOM = {
  peek: '148px',              // 72px handle + 56px nav + 20px buffer
  mid:  'calc(46vh + 64px)', // mid sheet top + nav + buffer
  full: 'calc(82vh + 64px)', // full sheet top + nav + buffer
} as const;

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

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheKey(lat: number, lng: number) {
  return `dc_cafes_${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

function readCache(lat: number, lng: number): Cafe[] | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(lat, lng));
    if (!raw) return null;
    const { cafes, ts } = JSON.parse(raw);
    return Date.now() - ts < CACHE_TTL ? cafes : null;
  } catch { return null; }
}

function writeCache(lat: number, lng: number, cafes: Cafe[]) {
  try {
    sessionStorage.setItem(cacheKey(lat, lng), JSON.stringify({ cafes, ts: Date.now() }));
  } catch { /* ignore */ }
}

async function loadCafes(
  lat: number,
  lng: number,
  setCafes: (cafes: Cafe[]) => void,
  setLoading: (loading: boolean) => void
) {
  const cached = readCache(lat, lng);
  const osmCafes = cached ?? await (async () => {
    setLoading(true);
    try {
      const cafes = await fetchNearbyCafes(lat, lng, 10000);
      if (cafes.length > 0) writeCache(lat, lng, cafes);
      return cafes;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  })();

  // Overlay Supabase ratings so reviews survive navigation / cache reads
  const withRatings = await mergeSupabaseRatings(osmCafes);
  setCafes(withRatings);
}

// Stores the Leaflet map instance so LocateButton can use it from outside MapContainer
function MapRefSetter() {
  const map = useMap();
  useEffect(() => {
    setMapRef(map);
    return () => setMapRef(null);
  }, [map]);
  return null;
}

function MapController({ onLocationDenied }: { onLocationDenied: () => void }) {
  const map = useMap();
  const { setUserLocation, setCafes, setLoading, setSelectedCafe, setSheetSnap } = useCafeStore();

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
        onLocationDenied();
        loadCafes(PUNE_CENTER.center.lat, PUNE_CENTER.center.lng, setCafes, setLoading);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [map, setUserLocation, setCafes, setLoading, onLocationDenied]);

  useMapEvents({
    click() {
      setSelectedCafe(null);
      setSheetSnap('peek');
    },
  });

  return null;
}

export function MapView() {
  const { filteredCafes, setSelectedCafe, setUserLocation, setCafes, setLoading,
          userLocation, isLoading, sheetSnap } = useCafeStore();
  const [locationDenied, setLocationDenied] = useState(false);

  const handleLocationDenied = useCallback(() => setLocationDenied(true), []);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocationDenied(false);
        const map = getMapRef();
        if (map) map.flyTo([loc.lat, loc.lng], 15, { duration: 1 });
        await loadCafes(loc.lat, loc.lng, setCafes, setLoading);
      },
      () => {}
    );
  };

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

        <MapRefSetter />
        <MapController onLocationDenied={handleLocationDenied} />

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

      {/* Locate button — floats above sheet, moves with it */}
      <div
        className="absolute right-4 z-[800] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ bottom: SNAP_BOTTOM[sheetSnap] }}
      >
        <button
          onClick={handleLocate}
          title="Find cafés near me"
          className="w-10 h-10 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.15)] border border-zinc-200 flex items-center justify-center active:bg-zinc-100 transition-colors"
        >
          <LocateFixed
            className="w-4 h-4"
            style={{ color: userLocation ? '#3b82f6' : '#52525b' }}
            strokeWidth={2.5}
          />
        </button>
      </div>

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
        <div className="absolute top-[88px] left-1/2 -translate-x-1/2 z-[800] w-[calc(100%-32px)] max-w-sm pointer-events-none">
          <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm text-xs text-zinc-600 px-3.5 py-2.5 rounded-2xl shadow-md border border-zinc-200">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
            <span>Showing cafés in Pune. Tap <strong className="text-zinc-800">locate</strong> to use your position.</span>
          </div>
        </div>
      )}
    </div>
  );
}
