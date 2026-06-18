'use client';

import { useRouter } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import { useCafeStore } from '@/lib/store/cafeStore';
import { useSavedStore } from '@/lib/store/savedStore';
import { CafeCard } from '@/components/cafe/CafeCard';
import { BottomNav } from '@/components/layout/BottomNav';

export default function SavedPage() {
  const { cafes, setSelectedCafe } = useCafeStore();
  const { savedIds, _hasHydrated } = useSavedStore();
  const router = useRouter();

  const savedCafes = cafes.filter((c) => savedIds.includes(c.id));

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-14 pb-4 border-b border-zinc-100">
        <h1 className="text-xl font-bold text-zinc-900">Saved</h1>
        {savedCafes.length > 0 && (
          <p className="text-xs text-zinc-400 mt-0.5">
            {savedCafes.length} {savedCafes.length === 1 ? 'café' : 'cafés'}
          </p>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 pb-20">
        {!_hasHydrated ? (
          // Show nothing while localStorage is loading to avoid flashing "empty" state
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
          </div>
        ) : savedCafes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3 px-6">
            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-700">No saved cafés yet</p>
            <p className="text-xs text-zinc-400">
              Tap the bookmark icon on any café to save it for later
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-2 bg-zinc-900 text-white rounded-2xl px-5 py-2.5 text-sm font-semibold"
            >
              Explore Map
            </button>
          </div>
        ) : (
          savedCafes.map((cafe) => (
            <CafeCard
              key={cafe.id}
              cafe={cafe}
              onClick={() => {
                setSelectedCafe(cafe);
                router.push('/');
              }}
            />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
