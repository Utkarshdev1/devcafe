'use client';

import { useCafeStore } from '@/lib/store/cafeStore';
import { CafeCard } from './CafeCard';
import { CafeDetail } from './CafeDetail';
import { cn } from '@/lib/utils';
import { X, ArrowLeft } from 'lucide-react';

const PEEK_HEIGHT = 80;

export function CafeSheet() {
  const { filteredCafes, selectedCafe, setSelectedCafe, isSheetOpen, setSheetOpen } =
    useCafeStore();

  const handleClose = () => {
    if (selectedCafe) {
      setSelectedCafe(null);
    } else {
      setSheetOpen(false);
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[900]',
        'bg-white rounded-t-[28px]',
        'shadow-[0_-8px_40px_rgba(0,0,0,0.10),0_-1px_0_rgba(0,0,0,0.04)]',
        'flex flex-col max-h-[82vh]',
        'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
        isSheetOpen ? 'translate-y-0' : `translate-y-[calc(100%-${PEEK_HEIGHT}px)]`
      )}
    >
      {/* Handle + header */}
      <div
        className="flex-shrink-0 pt-3 pb-3 px-4 cursor-pointer select-none"
        onClick={() => !isSheetOpen && setSheetOpen(true)}
      >
        {/* Drag handle */}
        <div className="w-10 h-[3px] bg-zinc-200 rounded-full mx-auto mb-3" />

        <div className="flex items-center justify-between gap-2">
          {selectedCafe ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedCafe(null); }}
                  className="p-1.5 -ml-1 rounded-xl hover:bg-zinc-100 transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 text-zinc-600" />
                </button>
                <p className="text-sm font-bold text-zinc-900 truncate">{selectedCafe.name}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
                className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5 text-zinc-600" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-900">
                  {filteredCafes.length} café{filteredCafes.length !== 1 ? 's' : ''} nearby
                </span>
                {!isSheetOpen && (
                  <span className="text-[11px] text-zinc-400 font-medium">· Tap to browse</span>
                )}
              </div>
              {isSheetOpen && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSheetOpen(false); }}
                  className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-zinc-600" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-zinc-100 flex-shrink-0" />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-24">
        {selectedCafe ? (
          <CafeDetail cafe={selectedCafe} />
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
  );
}
