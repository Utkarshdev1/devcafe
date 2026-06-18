'use client';

import { useRef } from 'react';
import { useCafeStore } from '@/lib/store/cafeStore';
import { CafeCard } from './CafeCard';
import { CafeDetail } from './CafeDetail';
import { cn } from '@/lib/utils';
import { ArrowLeft, ChevronDown, MapPin } from 'lucide-react';

const PEEK_HEIGHT = 64;
const SWIPE_THRESHOLD = 50;

export function CafeSheet() {
  const {
    filteredCafes, selectedCafe, setSelectedCafe,
    isSheetOpen, setSheetOpen, isLoading, userLocation,
  } = useCafeStore();

  const dragStartY = useRef(0);

  const handleHeaderTap = () => {
    if (selectedCafe) return;
    setSheetOpen(!isSheetOpen);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - dragStartY.current;
    if (dy > SWIPE_THRESHOLD) {
      if (selectedCafe) setSelectedCafe(null);
      else setSheetOpen(false);
    } else if (dy < -SWIPE_THRESHOLD && !isSheetOpen) {
      setSheetOpen(true);
    }
  };

  const emptyMessage = userLocation
    ? 'No cafés found within 10km of your location.'
    : 'Allow location access and we\'ll find real cafés near you.';

  return (
    <>
      {/* Backdrop — tapping it closes the sheet */}
      {isSheetOpen && (
        <div
          className="fixed inset-0 z-[850] bg-transparent"
          onClick={() => {
            if (selectedCafe) setSelectedCafe(null);
            else setSheetOpen(false);
          }}
        />
      )}

      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[900]',
          'bg-white rounded-t-[24px]',
          'shadow-[0_-4px_24px_rgba(0,0,0,0.08),0_-1px_0_rgba(0,0,0,0.04)]',
          'flex flex-col max-h-[82vh]',
          'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
          isSheetOpen ? 'translate-y-0' : `translate-y-[calc(100%-${PEEK_HEIGHT}px)]`
        )}
      >
        {/* Handle strip — full width tap/swipe target */}
        <div
          className="flex-shrink-0 pt-2.5 pb-3 px-4 cursor-pointer select-none touch-none"
          onClick={handleHeaderTap}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-9 h-[3px] bg-zinc-200 rounded-full mx-auto mb-3" />

          <div className="flex items-center justify-between gap-2">
            {selectedCafe ? (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedCafe(null); }}
                    className="p-2 -ml-1 rounded-xl active:bg-zinc-100 flex-shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4 text-zinc-600" />
                  </button>
                  <p className="text-sm font-bold text-zinc-900 truncate">{selectedCafe.name}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedCafe(null); setSheetOpen(false); }}
                  className="p-2 rounded-xl bg-zinc-100 flex-shrink-0"
                >
                  <ChevronDown className="w-4 h-4 text-zinc-600" />
                </button>
              </>
            ) : (
              <>
                <span className="text-sm font-bold text-zinc-900">
                  {isLoading ? 'Finding cafés…' : `${filteredCafes.length} café${filteredCafes.length !== 1 ? 's' : ''} nearby`}
                </span>
                {isSheetOpen ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSheetOpen(false); }}
                    className="p-2 rounded-xl bg-zinc-100"
                  >
                    <ChevronDown className="w-4 h-4 text-zinc-600" />
                  </button>
                ) : (
                  !isLoading && filteredCafes.length > 0 && (
                    <span className="text-[11px] text-zinc-400">Tap to browse</span>
                  )
                )}
              </>
            )}
          </div>
        </div>

        <div className="h-px bg-zinc-100 flex-shrink-0" />

        <div className="flex-1 overflow-y-auto overscroll-contain pb-24">
          {selectedCafe ? (
            <CafeDetail cafe={selectedCafe} />
          ) : filteredCafes.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-3">
              <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-zinc-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-700">No cafés found</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{emptyMessage}</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {filteredCafes.map((cafe) => (
                <CafeCard
                  key={cafe.id}
                  cafe={cafe}
                  isSelected={selectedCafe === cafe}
                  onClick={() => setSelectedCafe(cafe)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
