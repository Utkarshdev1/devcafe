'use client';

import { Cafe } from '@/types';
import { cn, formatRating, isOpenNow, distanceKm, formatDistance } from '@/lib/utils';
import { useCafeStore } from '@/lib/store/cafeStore';
import { AmenityBadge } from './AmenityBadge';
import { Star, MapPin } from 'lucide-react';

interface CafeCardProps {
  cafe: Cafe;
  onClick?: () => void;
  isSelected?: boolean;
}

export function CafeCard({ cafe, onClick, isSelected }: CafeCardProps) {
  const open = isOpenNow(cafe.opening_hours);
  const userLocation = useCafeStore((s) => s.userLocation);
  const distance = userLocation
    ? distanceKm(userLocation.lat, userLocation.lng, cafe.lat, cafe.lng)
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-4 py-4 text-left transition-colors group',
        isSelected ? 'bg-zinc-50' : 'hover:bg-zinc-50/60'
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-900 text-[13px] leading-snug truncate">
            {cafe.name}
          </h3>
        </div>

        {/* Rating badge */}
        <div className="flex items-center gap-1 bg-zinc-900 text-white rounded-lg px-2 py-0.5 flex-shrink-0">
          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-bold">{formatRating(cafe.rating)}</span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
        <MapPin className="w-3 h-3 text-zinc-400 flex-shrink-0" strokeWidth={2.5} />
        <span className="text-[11px] text-zinc-500">{cafe.neighborhood}</span>
        <span className="text-zinc-300 text-[10px]">·</span>
        <span
          className={cn(
            'text-[11px] font-semibold',
            open ? 'text-emerald-600' : 'text-zinc-400'
          )}
        >
          {open ? 'Open' : 'Closed'}
        </span>
        {distance !== null && (
          <>
            <span className="text-zinc-300 text-[10px]">·</span>
            <span className="text-[11px] text-zinc-500">{formatDistance(distance)}</span>
          </>
        )}
        {cafe.wifi_speed_mbps && (
          <>
            <span className="text-zinc-300 text-[10px]">·</span>
            <span className="text-[11px] text-zinc-500">{cafe.wifi_speed_mbps} Mbps</span>
          </>
        )}
      </div>

      {/* Amenity badges */}
      <div className="flex gap-1 flex-wrap">
        {cafe.amenities.slice(0, 4).map((amenity) => (
          <AmenityBadge key={amenity} amenity={amenity} small />
        ))}
        {cafe.amenities.length > 4 && (
          <span className="text-[10px] text-zinc-400 self-center font-medium">
            +{cafe.amenities.length - 4}
          </span>
        )}
      </div>
    </button>
  );
}
