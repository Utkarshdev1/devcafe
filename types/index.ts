export type Amenity =
  | 'wifi'
  | 'power_outlets'
  | 'quiet_zone'
  | 'outdoor_seating'
  | 'parking'
  | 'food'
  | 'good_coffee';

export type NoiseLevel = 'quiet' | 'moderate' | 'lively';
export type PowerOutlets = 'none' | 'few' | 'plenty';
export type PriceRange = 1 | 2 | 3;

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface Cafe {
  id: string;
  name: string;
  description: string;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  amenities: Amenity[];
  wifi_speed_mbps: number | null;
  noise_level: NoiseLevel;
  power_outlets: PowerOutlets;
  rating: number;
  review_count: number;
  avg_wifi_rating?: number | null;
  avg_noise_rating?: number | null;
  avg_power_rating?: number | null;
  images: string[];
  opening_hours: OpeningHours;
  price_range: PriceRange;
  phone: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  cafe_id: string;
  user_id: string;
  rating: number;
  comment: string;
  wifi_rating: number | null;
  wifi_speed_mbps: number | null;
  power_rating: number | null;
  noise_rating: number | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Profile {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface CafeFilter {
  amenities: Amenity[];
  noise_level: NoiseLevel | null;
  min_rating: number | null;
  price_range: PriceRange[];
  wifi_min_speed: number | null;
}

export interface MapViewport {
  center: { lat: number; lng: number };
  zoom: number;
}

export const PUNE_CENTER: MapViewport = {
  center: { lat: 18.5204, lng: 73.8567 },
  zoom: 13,
};

export const AMENITY_LABELS: Record<Amenity, string> = {
  wifi: 'WiFi',
  power_outlets: 'Power Outlets',
  quiet_zone: 'Quiet Zone',
  outdoor_seating: 'Outdoor',
  parking: 'Parking',
  food: 'Food',
  good_coffee: 'Great Coffee',
};

export const AMENITY_ICONS: Record<Amenity, string> = {
  wifi: '📶',
  power_outlets: '🔌',
  quiet_zone: '🤫',
  outdoor_seating: '🌿',
  parking: '🅿️',
  food: '🍴',
  good_coffee: '☕',
};
