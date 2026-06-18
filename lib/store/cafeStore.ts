import { create } from 'zustand';
import { Cafe, CafeFilter, MapViewport, PUNE_CENTER } from '@/types';
import { distanceKm } from '@/lib/utils';

type UserLocation = { lat: number; lng: number };

interface CafeState {
  cafes: Cafe[];
  filteredCafes: Cafe[];
  selectedCafe: Cafe | null;
  filter: CafeFilter;
  viewport: MapViewport;
  isSheetOpen: boolean;
  isLoading: boolean;
  userLocation: UserLocation | null;

  setCafes: (cafes: Cafe[]) => void;
  setSelectedCafe: (cafe: Cafe | null) => void;
  setFilter: (filter: Partial<CafeFilter>) => void;
  setViewport: (viewport: Partial<MapViewport>) => void;
  setSheetOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setUserLocation: (loc: UserLocation | null) => void;
  resetFilter: () => void;
}

const defaultFilter: CafeFilter = {
  amenities: [],
  noise_level: null,
  min_rating: null,
  price_range: [],
  wifi_min_speed: null,
};

function applyFilter(cafes: Cafe[], filter: CafeFilter): Cafe[] {
  return cafes.filter((cafe) => {
    if (filter.amenities.length > 0) {
      if (!filter.amenities.every((a) => cafe.amenities.includes(a))) return false;
    }
    if (filter.noise_level && cafe.noise_level !== filter.noise_level) return false;
    if (filter.min_rating && cafe.rating < filter.min_rating) return false;
    if (filter.price_range.length > 0 && !filter.price_range.includes(cafe.price_range)) return false;
    if (filter.wifi_min_speed && (cafe.wifi_speed_mbps ?? 0) < filter.wifi_min_speed) return false;
    return true;
  });
}

function sortByDistance(cafes: Cafe[], loc: UserLocation | null): Cafe[] {
  if (!loc) return cafes;
  return [...cafes].sort(
    (a, b) =>
      distanceKm(loc.lat, loc.lng, a.lat, a.lng) -
      distanceKm(loc.lat, loc.lng, b.lat, b.lng)
  );
}

function derive(cafes: Cafe[], filter: CafeFilter, loc: UserLocation | null): Cafe[] {
  return sortByDistance(applyFilter(cafes, filter), loc);
}

export const useCafeStore = create<CafeState>((set, get) => ({
  cafes: [],
  filteredCafes: [],
  selectedCafe: null,
  filter: defaultFilter,
  viewport: PUNE_CENTER,
  isSheetOpen: false,
  isLoading: false,
  userLocation: null,

  setCafes: (cafes) =>
    set({ cafes, filteredCafes: derive(cafes, get().filter, get().userLocation) }),

  setSelectedCafe: (cafe) =>
    set({ selectedCafe: cafe, isSheetOpen: !!cafe }),

  setFilter: (partial) => {
    const filter = { ...get().filter, ...partial };
    set({ filter, filteredCafes: derive(get().cafes, filter, get().userLocation) });
  },

  setViewport: (partial) =>
    set((s) => ({ viewport: { ...s.viewport, ...partial } })),

  setSheetOpen: (open) => set({ isSheetOpen: open }),

  setLoading: (loading) => set({ isLoading: loading }),

  setUserLocation: (loc) =>
    set({ userLocation: loc, filteredCafes: derive(get().cafes, get().filter, loc) }),

  resetFilter: () =>
    set({ filter: defaultFilter, filteredCafes: derive(get().cafes, defaultFilter, get().userLocation) }),
}));
