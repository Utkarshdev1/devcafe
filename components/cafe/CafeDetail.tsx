'use client';

import { useState, useEffect } from 'react';
import { Cafe, Review } from '@/types';
import { cn, formatRating, getPriceLabel, isOpenNow } from '@/lib/utils';
import { useSavedStore } from '@/lib/store/savedStore';
import { useAuthStore } from '@/lib/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { AmenityBadge } from './AmenityBadge';
import { ReviewModal } from './ReviewModal';
import { MapPin, Star, Navigation, PenLine, Wifi, Zap, Volume2, Bookmark } from 'lucide-react';

interface CafeDetailProps {
  cafe: Cafe;
}

const OUTLET_LABEL: Record<string, string> = {
  none: 'None',
  few: 'A few',
  plenty: 'Plenty',
};

const NOISE_LABEL: Record<string, string> = {
  quiet: 'Quiet',
  moderate: 'Moderate',
  lively: 'Lively',
};

export function CafeDetail({ cafe }: CafeDetailProps) {
  const open = isOpenNow(cafe.opening_hours);
  const { isSaved, toggle, toggleAndSync } = useSavedStore();
  const { user } = useAuthStore();
  const saved = isSaved(cafe.id);
  const [showReview, setShowReview] = useState(false);

  return (
    <>
      <div className="px-4 pt-1 pb-8">
        {/* Rating + meta */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-zinc-900 text-sm">{formatRating(cafe.rating)}</span>
            <span className="text-zinc-400 text-xs">({cafe.review_count})</span>
          </div>
          <span className="text-zinc-200 text-xs">·</span>
          <span className="text-zinc-600 text-xs font-semibold">{getPriceLabel(cafe.price_range)}</span>
          <span className="text-zinc-200 text-xs">·</span>
          <span
            className={cn(
              'text-xs font-semibold',
              open ? 'text-emerald-600' : 'text-zinc-400'
            )}
          >
            {open ? 'Open now' : 'Closed'}
          </span>
        </div>

        {/* Address */}
        <div className="flex items-start gap-1.5 mb-4">
          <MapPin className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" strokeWidth={2} />
          <p className="text-xs text-zinc-500 leading-relaxed">{cafe.address || cafe.neighborhood}</p>
        </div>

        {/* Dev stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-zinc-400" strokeWidth={2.5} />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">WiFi</span>
            </div>
            <span className="text-sm font-bold text-zinc-900">
              {cafe.wifi_speed_mbps
                ? `${cafe.wifi_speed_mbps} Mbps`
                : cafe.avg_wifi_rating != null
                ? `${cafe.avg_wifi_rating.toFixed(1)} ★`
                : cafe.amenities.includes('wifi')
                ? 'Available'
                : '—'}
            </span>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-zinc-400" strokeWidth={2.5} />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Noise</span>
            </div>
            <span className="text-sm font-bold text-zinc-900 capitalize">
              {cafe.avg_noise_rating != null
                ? `${cafe.avg_noise_rating.toFixed(1)} ★`
                : NOISE_LABEL[cafe.noise_level] ?? '—'}
            </span>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-zinc-400" strokeWidth={2.5} />
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Outlets</span>
            </div>
            <span className="text-sm font-bold text-zinc-900">
              {cafe.avg_power_rating != null
                ? `${cafe.avg_power_rating.toFixed(1)} ★`
                : OUTLET_LABEL[cafe.power_outlets] ?? '—'}
            </span>
          </div>
        </div>

        {/* Amenities */}
        {cafe.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {cafe.amenities.map((amenity) => (
              <AmenityBadge key={amenity} amenity={amenity} />
            ))}
          </div>
        )}

        {/* Description */}
        {cafe.description && (
          <p className="text-[13px] text-zinc-500 leading-relaxed mb-5">{cafe.description}</p>
        )}

        {/* CTAs */}
        <div className="flex gap-2.5">
          <button
            onClick={() => setShowReview(true)}
            className="flex-1 bg-zinc-900 active:bg-zinc-800 text-white rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <PenLine className="w-3.5 h-3.5" />
            Write a Review
          </button>

          <button
            onClick={() =>
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}`,
                '_blank'
              )
            }
            className="flex-1 border border-zinc-200 text-zinc-700 rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5 active:bg-zinc-50 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            Directions
          </button>

          <button
            onClick={() => user ? toggleAndSync(cafe, user.id) : toggle(cafe)}
            className={cn(
              'w-12 rounded-2xl border flex items-center justify-center transition-colors flex-shrink-0',
              saved
                ? 'bg-zinc-900 border-zinc-900 text-white active:bg-zinc-800'
                : 'border-zinc-200 text-zinc-700 active:bg-zinc-50'
            )}
            title={saved ? 'Remove from saved' : 'Save café'}
          >
            <Bookmark className={cn('w-4 h-4', saved && 'fill-current')} />
          </button>
        </div>
      </div>

      {showReview && (
        <ReviewModal cafe={cafe} onClose={() => setShowReview(false)} />
      )}
    </>
  );
}
