import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { NoiseLevel, OpeningHours, PriceRange } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatWifiSpeed(mbps: number | null): string {
  if (!mbps) return 'Unknown';
  if (mbps >= 100) return `${mbps} Mbps · Blazing`;
  if (mbps >= 50) return `${mbps} Mbps · Fast`;
  if (mbps >= 20) return `${mbps} Mbps · Good`;
  return `${mbps} Mbps · Basic`;
}

export function getPriceLabel(range: PriceRange): string {
  return '₹'.repeat(range);
}

export function getNoiseLevelLabel(level: NoiseLevel): string {
  const labels: Record<NoiseLevel, string> = {
    quiet: '🤫 Quiet',
    moderate: '🔉 Moderate',
    lively: '🔊 Lively',
  };
  return labels[level];
}

export function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}

export function isOpenNow(hours: OpeningHours): boolean {
  const now = new Date();
  const dayIndex = now.getDay();
  const dayKeys: (keyof OpeningHours)[] = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
  ];
  const dayHours = hours[dayKeys[dayIndex]];
  if (!dayHours || dayHours.closed) return false;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return currentTime >= dayHours.open && currentTime <= dayHours.close;
}
