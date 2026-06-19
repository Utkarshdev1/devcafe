import { Cafe, Amenity, OpeningHours } from '@/types';

interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;                          // nodes have lat/lon directly
  lon?: number;
  center?: { lat: number; lon: number }; // ways have center when using `out center`
  tags: Record<string, string>;
}

interface OverpassResponse {
  elements: OSMElement[];
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
  const result: Amenity[] = [];
  const amenity = tags.amenity ?? '';
  const shop    = tags.shop    ?? '';

  if (amenity === 'cafe' || amenity === 'coffee_shop' || shop === 'coffee') {
    result.push('good_coffee');
  }
  if (amenity === 'bakery' || shop === 'bakery') {
    result.push('food');
  }
  if (tags.internet_access === 'wlan' || tags.internet_access === 'yes') result.push('wifi');
  if (tags.outdoor_seating === 'yes') result.push('outdoor_seating');
  if (tags.food === 'yes' || (tags.cuisine && amenity !== 'bakery')) result.push('food');
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
  radiusMeters = 10000
): Promise<Cafe[]> {
  const url = `/api/cafes?lat=${lat}&lng=${lng}&radius=${radiusMeters}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 28_000);

  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw new Error(`/api/cafes ${res.status}`);

  const data: OverpassResponse = await res.json();

  return data.elements
    .filter((el) => {
      if (!el.tags?.name) return false;
      const hasCoord = (el.lat != null && el.lon != null) || el.center != null;
      if (!hasCoord) return false;
      // Only show well-documented places — require at least 2 real-world details
      const t = el.tags;
      const score = [
        t['addr:street'] || t['addr:full'] || t['addr:housenumber'],
        t['addr:suburb'] || t['addr:neighbourhood'] || t['addr:city'],
        t.phone || t['contact:phone'],
        t.website || t['contact:website'],
        t.opening_hours,
        t.cuisine || t.description,
      ].filter(Boolean).length;
      return score >= 2;
    })
    .map((el): Cafe => {
      const elLat = el.lat ?? el.center!.lat;
      const elLng = el.lon ?? el.center!.lon;
      return {
        id: `osm-${el.id}`,
        name: el.tags.name,
        description: el.tags.description || '',
        address: buildAddress(el.tags),
        neighborhood: el.tags['addr:suburb'] || el.tags['addr:neighbourhood'] || el.tags['addr:city'] || '',
        lat: elLat,
        lng: elLng,
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
      };
    });
}
