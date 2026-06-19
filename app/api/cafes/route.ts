import { NextRequest, NextResponse } from 'next/server';

const OVERPASS_INSTANCES = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

// Module-level cache — survives hot-reloads within the same dev-server process
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') ?? '10000';

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  const key = `${parseFloat(lat).toFixed(2)},${parseFloat(lng).toFixed(2)},${radius}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    return NextResponse.json(hit.data, {
      headers: { 'Cache-Control': 'public, s-maxage=600' },
    });
  }

  const query = `[out:json][timeout:15];
(
  node["amenity"="cafe"](around:${radius},${lat},${lng});
  node["amenity"="coffee_shop"](around:${radius},${lat},${lng});
  node["shop"="coffee"](around:${radius},${lat},${lng});
  node["amenity"="bar"](around:${radius},${lat},${lng});
  node["amenity"="pub"](around:${radius},${lat},${lng});
  node["amenity"="bakery"](around:${radius},${lat},${lng});
  node["shop"="bakery"](around:${radius},${lat},${lng});
  way["amenity"="cafe"](around:${radius},${lat},${lng});
  way["amenity"="bar"](around:${radius},${lat},${lng});
  way["amenity"="pub"](around:${radius},${lat},${lng});
  way["amenity"="bakery"](around:${radius},${lat},${lng});
  way["shop"="bakery"](around:${radius},${lat},${lng});
);
out body center;`;

  // Race all instances — first successful response wins
  const data = await Promise.any(
    OVERPASS_INSTANCES.map(async (url) => {
      const res = await fetch(url, {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': 'DevCafe/1.0 (https://github.com/Utkarshdev1/devcafe)',
        },
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error(`[overpass] ${url} → ${res.status}`, body.slice(0, 200));
        throw new Error(`${res.status}`);
      }
      return res.json();
    })
  ).catch((err) => {
    console.error('[overpass] all instances failed', err);
    return null;
  });

  if (!data) {
    return NextResponse.json({ error: 'All Overpass instances failed' }, { status: 502 });
  }

  cache.set(key, { data, ts: Date.now() });
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=600' },
  });
}
