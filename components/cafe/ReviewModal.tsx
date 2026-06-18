'use client';

import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Cafe } from '@/types';
import { useAuthStore } from '@/lib/store/authStore';
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
            className="p-0.5"
          >
            <Star
              className={cn(
                'w-6 h-6 transition-colors',
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
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [wifiRating, setWifiRating] = useState(0);
  const [noiseRating, setNoiseRating] = useState(0);
  const [powerRating, setPowerRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!user) {
    return (
      <div className="fixed inset-0 z-[1100] flex items-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-full bg-white rounded-t-[24px] px-5 py-6 text-center">
          <p className="font-bold text-zinc-900 text-base mb-1">Sign in to write a review</p>
          <p className="text-sm text-zinc-500 mb-5">Your reviews help devs find the best spots to work</p>
          <button
            onClick={() => { onClose(); router.push('/login'); }}
            className="bg-zinc-900 text-white rounded-2xl px-6 py-3 text-sm font-semibold w-full"
          >
            Sign in
          </button>
          <button onClick={onClose} className="mt-3 text-sm text-zinc-400 py-2 w-full">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-[1100] flex items-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-full bg-white rounded-t-[24px] px-5 py-8 text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-6 h-6 fill-emerald-500 text-emerald-500" />
          </div>
          <p className="font-bold text-zinc-900 text-base mb-1">Review submitted!</p>
          <p className="text-sm text-zinc-500 mb-5">Thanks for helping the dev community</p>
          <button onClick={onClose} className="bg-zinc-900 text-white rounded-2xl px-6 py-3 text-sm font-semibold w-full">
            Done
          </button>
        </div>
      </div>
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

      const { error: reviewErr } = await supabase.from('reviews').upsert(
        {
          cafe_id: cafeRow.id,
          user_id: user.id,
          rating,
          wifi_rating: wifiRating || null,
          noise_rating: noiseRating || null,
          power_rating: powerRating || null,
          comment: comment.trim() || null,
        },
        { onConflict: 'cafe_id,user_id' }
      );

      if (reviewErr) throw reviewErr;
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-[24px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-4 pt-5 pb-3 border-b border-zinc-100">
          <div>
            <p className="text-[11px] text-zinc-400 uppercase tracking-wide font-semibold">Review</p>
            <p className="font-bold text-zinc-900 text-sm truncate max-w-[240px]">{cafe.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-zinc-100 active:bg-zinc-200">
            <X className="w-4 h-4 text-zinc-600" />
          </button>
        </div>

        <div className="px-4 py-5 flex flex-col gap-5">
          {/* Overall */}
          <StarRow label="Overall" value={rating} onChange={setRating} />

          <div className="h-px bg-zinc-100" />

          {/* Dev-specific */}
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">For developers</p>
            <StarRow label="WiFi quality" value={wifiRating} onChange={setWifiRating} />
            <StarRow label="Noise level" value={noiseRating} onChange={setNoiseRating} />
            <StarRow label="Power outlets" value={powerRating} onChange={setPowerRating} />
          </div>

          <div className="h-px bg-zinc-100" />

          {/* Comment */}
          <div>
            <label className="text-sm font-medium text-zinc-700 block mb-2">
              Comment <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How's the WiFi speed? Plenty of outlets? Good for long sessions?"
              rows={3}
              className="w-full border border-zinc-200 rounded-2xl px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-500 -mt-2">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-40 active:bg-zinc-800 transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>

          <div className="pb-safe" />
        </div>
      </div>
    </div>
  );
}
