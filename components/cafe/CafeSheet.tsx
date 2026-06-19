'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useCafeStore, SheetSnap } from '@/lib/store/cafeStore';
import { CafeCard } from './CafeCard';
import { CafeDetail } from './CafeDetail';
import { cn } from '@/lib/utils';
import { ArrowLeft, ChevronDown, MapPin } from 'lucide-react';

const HANDLE_HEIGHT = 72;
const SHEET_MAX_VH = 82;

function sheetPixelHeight() {
  return typeof window !== 'undefined'
    ? (SHEET_MAX_VH / 100) * window.innerHeight
    : 600;
}

function translateYForSnap(snap: SheetSnap): number {
  const h = sheetPixelHeight();
  if (snap === 'full') return 0;
  if (snap === 'mid') return h * 0.45;
  return h - HANDLE_HEIGHT;
}

function nearestSnap(ty: number, velocity: number): SheetSnap {
  const peek = translateYForSnap('peek');
  const mid  = translateYForSnap('mid');
  const full = translateYForSnap('full');

  if (velocity > 0.4)  return ty > mid ? 'peek' : 'mid';
  if (velocity < -0.4) return ty < mid ? 'full' : 'mid';

  const dFull = Math.abs(ty - full);
  const dMid  = Math.abs(ty - mid);
  const dPeek = Math.abs(ty - peek);
  if (dFull <= dMid && dFull <= dPeek) return 'full';
  if (dMid  <= dFull && dMid  <= dPeek) return 'mid';
  return 'peek';
}

export function CafeSheet() {
  const {
    filteredCafes, selectedCafe, setSelectedCafe,
    sheetSnap, setSheetSnap, isLoading, userLocation,
  } = useCafeStore();

  const sheetRef    = useRef<HTMLDivElement>(null);
  const isDragging  = useRef(false);
  const dragRef     = useRef({ startY: 0, startTranslateY: 0, lastY: 0, lastTime: 0, velocity: 0 });

  const applyTransform = useCallback((ty: number, animated: boolean) => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transition = animated ? 'transform 0.35s cubic-bezier(0.32,0.72,0,1)' : 'none';
    el.style.transform  = `translateY(${ty}px)`;
  }, []);

  useEffect(() => {
    applyTransform(translateYForSnap(sheetSnap), true);
  }, [sheetSnap, applyTransform]);

  // ── shared drag core ──────────────────────────────────────────────
  const startDrag = useCallback((clientY: number) => {
    const d = dragRef.current;
    d.startY          = clientY;
    d.lastY           = clientY;
    d.lastTime        = Date.now();
    d.velocity        = 0;
    d.startTranslateY = translateYForSnap(sheetSnap);
    applyTransform(d.startTranslateY, false);
    isDragging.current = true;
  }, [sheetSnap, applyTransform]);

  const moveDrag = useCallback((clientY: number) => {
    if (!isDragging.current) return;
    const d   = dragRef.current;
    const now = Date.now();
    const dt  = now - d.lastTime || 1;
    d.velocity = (clientY - d.lastY) / dt;
    d.lastY    = clientY;
    d.lastTime = now;

    const raw     = d.startTranslateY + (clientY - d.startY);
    const clamped = Math.max(0, Math.min(translateYForSnap('peek'), raw));
    applyTransform(clamped, false);
  }, [applyTransform]);

  const endDrag = useCallback((clientY: number) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const d      = dragRef.current;
    const totalDy = clientY - d.startY;

    if (Math.abs(totalDy) < 6) {
      // tap: cycle through snaps
      const next: SheetSnap =
        sheetSnap === 'peek' ? 'mid' : sheetSnap === 'mid' ? 'full' : 'peek';
      applyTransform(translateYForSnap(next), true);
      setSheetSnap(next);
      return;
    }

    const raw     = d.startTranslateY + totalDy;
    const clamped = Math.max(0, Math.min(translateYForSnap('peek'), raw));
    const nearest = nearestSnap(clamped, d.velocity);
    applyTransform(translateYForSnap(nearest), true);
    setSheetSnap(nearest);
  }, [sheetSnap, setSheetSnap, applyTransform]);

  // ── touch handlers ────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startDrag(e.touches[0].clientY);
  }, [startDrag]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    moveDrag(e.touches[0].clientY);
  }, [moveDrag]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    endDrag(e.changedTouches[0].clientY);
  }, [endDrag]);

  // ── mouse handlers (desktop) ──────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientY);

    const onMove = (ev: MouseEvent) => moveDrag(ev.clientY);
    const onUp   = (ev: MouseEvent) => {
      endDrag(ev.clientY);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }, [startDrag, moveDrag, endDrag]);

  // ── close helper ──────────────────────────────────────────────────
  const closeSheet = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    applyTransform(translateYForSnap('peek'), true);
    setSheetSnap('peek');
  }, [setSheetSnap, applyTransform]);

  const emptyMessage = userLocation
    ? 'No cafés found within 10km of your location.'
    : "Allow location access and we'll find real cafés near you.";

  return (
    <div
      ref={sheetRef}
      className="fixed bottom-14 left-0 right-0 z-[950] bg-white rounded-t-[24px] shadow-[0_-4px_24px_rgba(0,0,0,0.08),0_-1px_0_rgba(0,0,0,0.04)] flex flex-col"
      style={{
        height: `${SHEET_MAX_VH}vh`,
        transform: `translateY(${translateYForSnap(sheetSnap)}px)`,
        willChange: 'transform',
      }}
    >
      {/* Drag handle strip — responds to both mouse and touch */}
      <div
        className="flex-shrink-0 pt-2.5 pb-3 px-4 select-none touch-none cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
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
              <button onClick={closeSheet} className="p-2 rounded-xl bg-zinc-100 flex-shrink-0">
                <ChevronDown className="w-4 h-4 text-zinc-600" />
              </button>
            </>
          ) : (
            <>
              <span className="text-sm font-bold text-zinc-900">
                {isLoading
                  ? 'Finding cafés…'
                  : `${filteredCafes.length} café${filteredCafes.length !== 1 ? 's' : ''} nearby`}
              </span>
              {sheetSnap !== 'peek' && (
                <button onClick={closeSheet} className="p-2 rounded-xl bg-zinc-100">
                  <ChevronDown className="w-4 h-4 text-zinc-600" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="h-px bg-zinc-100 flex-shrink-0" />

      <div className={cn(
        'flex-1 overflow-y-auto overscroll-contain pb-4',
        sheetSnap === 'peek' && 'overflow-hidden pointer-events-none',
      )}>
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
                onClick={() => {
                  setSelectedCafe(cafe);
                  if (sheetSnap === 'peek') setSheetSnap('full');
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
