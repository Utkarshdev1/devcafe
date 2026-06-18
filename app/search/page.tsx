'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useCafeStore } from '@/lib/store/cafeStore';
import { CafeCard } from '@/components/cafe/CafeCard';
import { BottomNav } from '@/components/layout/BottomNav';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { cafes, setSelectedCafe } = useCafeStore();
  const router = useRouter();

  const results = query.trim()
    ? cafes.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.neighborhood?.toLowerCase().includes(query.toLowerCase())
      )
    : cafes;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-14 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2.5 bg-zinc-100 rounded-2xl px-3.5 py-2.5">
          <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cafés by name or area…"
            className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-xs text-zinc-400 font-medium">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      {cafes.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2">
          <p className="text-xs text-zinc-400">
            {results.length} {results.length === 1 ? 'café' : 'cafés'}
            {query ? ' matching' : ' nearby'}
            {query ? <> &ldquo;{query}&rdquo;</> : null}
          </p>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 pb-20">
        {cafes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3 px-6">
            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
              <Search className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-sm font-semibold text-zinc-700">No cafés loaded yet</p>
            <p className="text-xs text-zinc-400">Open the Map tab to find cafés near you first</p>
            <button
              onClick={() => router.push('/')}
              className="mt-2 bg-zinc-900 text-white rounded-2xl px-5 py-2.5 text-sm font-semibold"
            >
              Go to Map
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2 px-6">
            <p className="text-sm font-semibold text-zinc-700">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="text-xs text-zinc-400">Try a different name or neighbourhood</p>
          </div>
        ) : (
          results.map((cafe) => (
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
