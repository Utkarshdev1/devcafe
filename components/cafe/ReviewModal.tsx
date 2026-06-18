'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Cafe } from '@/types';
import { useAuthStore } from '@/lib/store/authStore';
import { useCafeStore } from '@/lib/store/cafeStore';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface ReviewModalProps {
  cafe: Cafe;
  onClose: () => void;
}

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n === value ? 0 : n)}
            className="p-0.5 active:scale-90 transition-transform"
          >
            <Star
              className={cn(
                'w-7 h-7 transition-colors',
                n <= value ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewModal({ cafe, onClose }: ReviewModalProps) {
  const { user } = useAuthStore();
  const { updateCafe } = useCafeStore();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [wifiRating, setWifiRating] = useState(0);
  const [wifiSpeed, setWifiSpeed] = useState('');
  const [noiseRating, setNoiseRating] = useState(0);
  const [powerRating, setPowerRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!user) {
    return createPortal(
      <div className="fixed inset-0 z-[2000] flex items-end">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full bg-white rounded-t-[24px] px-5 pt-6 pb-[max(24px,env(safe-area-inset-bottom,0px))] text-center">
          <p className="font-bold text-zinc-900 text-base mb-1">Sign in to write a review</p>
          <p className="text-sm text-zinc-500 mb-5">Your reviews help devs find the best spots</p>
          <button
            onClick={() => { onClose(); router.push('/login'); }}
            className="bg-zinc-900 text-white rounded-2xl px-6 py-3.5 text-sm font-semibold w-full"
          >
            Sign in
          </button>
          <button onClick={onClose} className="mt-3 text-sm text-zinc-400 py-2 w-full">
            Not now
          </button>
        </div>
      </div>,
      document.body
    );
  }

  if (done) {
    return createPortal(
      <div className="fixed inset-0 z-[2000] flex items-end">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full bg-white rounded-t-[24px] px-5 pt-8 pb-[max(32px,env(safe-area-inset-bottom,0px))] text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="font-bold text-zinc-900 text-lg mb-1">Review submitted!</p>
          <p className="text-sm text-zinc-500 mb-6">Thanks for helping the dev community find great spots</p>
          <button
            onClick={onClose}
            className="bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-semibold w-full active:bg-zinc-800"
          >
            Done
          </button>
        </div>
      </div>,
      document.body
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please add an overall rating'); return; }
    setSubmitting(true);
    setError('');

    try {
      const supabase = createClient();

      const { data: cafeRow, error: cafeErr } = await supabase
        .from('cafes')
        .upsert(
          {
            osm_id: cafe.id,
            name: cafe.name,
            address: cafe.address || cafe.neighborhood || 'Unknown',
            neighborhood: cafe.neighborhood,
            lat: cafe.lat,
            lng: cafe.lng,
            amenities: cafe.amenities,
            noise_level: cafe.noise_level,
            power_outlets: cafe.power_outlets,
            opening_hours: cafe.opening_hours,
            price_range: cafe.price_range,
          },
          { onConflict: 'osm_id' }
        )
        .select('id')
        .single();

      if (cafeErr) throw cafeErr;

      const speedNum = wifiSpeed ? parseInt(wifiSpeed, 10) : null;

      const { error: reviewErr } = await supabase.from('reviews').upsert(
        {
          cafe_id: cafeRow.id,
          user_id: user.id,
          rating,
          wifi_rating: wifiRating || null,
          wifi_speed_mbps: speedNum && speedNum > 0 ? speedNum : null,
          noise_rating: noiseRating || null,
          power_rating: powerRating || null,
          comment: comment.trim() || null,
        },
        { onConflict: 'cafe_id,user_id' }
      );

      if (reviewErr) throw reviewErr;

      // Compute averages from all reviews for this café
      const { data: allReviews } = await supabase
        .from('reviews')
        .select('rating, wifi_rating, wifi_speed_mbps, noise_rating, power_rating')
        .eq('cafe_id', cafeRow.id);

      const reviewCount = allReviews?.length ?? 1;
      const avg = (field: 'rating' | 'wifi_rating' | 'wifi_speed_mbps' | 'noise_rating' | 'power_rating') => {
        const vals = (allReviews ?? []).map((r) => r[field]).filter((v): v is number => v != null);
        return vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null;
      };

      const avgRating       = avg('rating') ?? rating;
      const avgWifiRating   = avg('wifi_rating');
      const avgWifiSpeed    = avg('wifi_speed_mbps');
      const avgNoiseRating  = avg('noise_rating');
      const avgPowerRating  = avg('power_rating');

      await supabase
        .from('cafes')
        .update({
          rating: avgRating,
          review_count: reviewCount,
          wifi_speed_mbps: avgWifiSpeed,
          avg_wifi_rating: avgWifiRating,
          avg_noise_rating: avgNoiseRating,
          avg_power_rating: avgPowerRating,
        })
        .eq('id', cafeRow.id);

      updateCafe(cafe.id, {
        rating: avgRating,
        review_count: reviewCount,
        wifi_speed_mbps: avgWifiSpeed,
        avg_wifi_rating: avgWifiRating,
        avg_noise_rating: avgNoiseRating,
        avg_power_rating: avgPowerRating,
      });

      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet — fixed height, internal scroll */}
      <div className="relative w-full bg-white rounded-t-[24px] flex flex-col max-h-[88vh]">
        {/* Sticky header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 pt-5 pb-3 border-b border-zinc-100">
          <div>
            <p className="text-[11px] text-zinc-400 uppercase tracking-wide font-semibold">Review</p>
            <p className="font-bold text-zinc-900 text-sm truncate max-w-[240px]">{cafe.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-zinc-100 active:bg-zinc-200">
            <X className="w-4 h-4 text-zinc-600" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 flex flex-col gap-5">
          <StarRow label="Overall" value={rating} onChange={setRating} />

          <div className="h-px bg-zinc-100" />

          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">
              For developers
            </p>
            <StarRow label="WiFi quality" value={wifiRating} onChange={setWifiRating} />

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-zinc-700">WiFi speed</span>
                <p className="text-[11px] text-zinc-400">Run a speed test first</p>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-100 rounded-2xl px-3 py-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={2000}
                  value={wifiSpeed}
                  onChange={(e) => setWifiSpeed(e.target.value)}
                  placeholder="—"
                  className="w-14 bg-transparent text-sm font-bold text-zinc-900 text-right outline-none placeholder:text-zinc-400"
                />
                <span className="text-xs text-zinc-400 font-medium">Mbps</span>
              </div>
            </div>

            <StarRow label="Noise level" value={noiseRating} onChange={setNoiseRating} />
            <StarRow label="Power outlets" value={powerRating} onChange={setPowerRating} />
          </div>

          <div className="h-px bg-zinc-100" />

          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-2">
              Comment <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How's the WiFi? Plenty of outlets? Good for long work sessions?"
              rows={3}
              className="w-full border border-zinc-200 rounded-2xl px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 resize-none"
            />
          </div>
        </div>

        {/* Sticky submit — always visible above keyboard / home bar */}
        <div className="flex-shrink-0 px-4 pt-3 pb-[max(20px,env(safe-area-inset-bottom,0px))] border-t border-zinc-100 bg-white">
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-40 active:bg-zinc-800 transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
