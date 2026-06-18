import { Cafe, Amenity, OpeningHours } from '@/types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

interface OSMNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface OverpassResponse {
  elements: OSMNode[];
}

const DEFAULT_HOURS: OpeningHours = {
  monday:    { open: '08:00', close: '22:00', closed: false },
  tuesday:   { open: '08:00', close: '22:00', closed: false },
  wednesday: { open: '08:00', close: '22:00', closed: false },
  thursday:  { open: '08:00', close: '22:00', closed: false },
  friday:    { open: '08:00', close: '23:00', closed: false },
  saturday:  { open: '09:00', close: '23:00', closed: false },
  sunday:    { open: '09:00', close: '21:00', closed: false },
};

function inferAmenities(tags: Record<string, string>): Amenity[] {
  const result: Amenity[] = ['good_coffee'];
  if (tags.internet_access === 'wlan' || tags.internet_access === 'yes') result.push('wifi');
  if (tags.outdoor_seating === 'yes') result.push('outdoor_seating');
  if (tags.food === 'yes' || tags.cuisine) result.push('food');
  return result;
}

function buildAddress(tags: Record<string, string>): string {
  return [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'] || tags['addr:neighbourhood'],
    tags['addr:city'],
  ]
    .filter(Boolean)
    .join(', ') || tags['addr:full'] || '';
}

export async function fetchNearbyCafes(
  lat: number,
  lng: number,
  radiusMeters = 3000
): Promise<Cafe[]> {
  const query = `[out:json][timeout:20];
(
  node["amenity"="cafe"](around:${radiusMeters},${lat},${lng});
  node["amenity"="coffee_shop"](around:${radiusMeters},${lat},${lng});
);
out body;`;

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'text/plain' },
    signal: AbortSignal.timeout(22_000),
  });

  if (!res.ok) throw new Error(`Overpass ${res.status}`);

  const data: OverpassResponse = await res.json();

  return data.elements
    .filter((el) => el.tags?.name)
    .map((el): Cafe => ({
      id: `osm-${el.id}`,
      name: el.tags.name,
      description: el.tags.description || '',
      address: buildAddress(el.tags),
      neighborhood: el.tags['addr:suburb'] || el.tags['addr:neighbourhood'] || el.tags['addr:city'] || '',
      lat: el.lat,
      lng: el.lon,
      amenities: inferAmenities(el.tags),
      wifi_speed_mbps: null,
      noise_level: 'moderate',
      power_outlets: 'none',
      rating: 0,
      review_count: 0,
      images: [],
      opening_hours: DEFAULT_HOURS,
      price_range: 2,
      phone: el.tags.phone || el.tags['contact:phone'] || null,
      website: el.tags.website || el.tags['contact:website'] || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
}
