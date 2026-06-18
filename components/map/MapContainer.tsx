'use client';

import dynamic from 'next/dynamic';
import { FilterBar } from './FilterBar';
import { Header } from '@/components/layout/Header';
import { CafeSheet } from '@/components/cafe/CafeSheet';
import { BottomNav } from '@/components/layout/BottomNav';

// Leaflet uses window — must be loaded client-side only
const MapView = dynamic(
  () => import('./MapView').then((m) => ({ default: m.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-zinc-100 animate-pulse" />
    ),
  }
);

export function MapContainer() {
  return (
    <>
      <div className="absolute inset-0">
        <MapView />
      </div>

      <div className="absolute top-0 left-0 right-0 z-[800] pointer-events-none">
        <div className="pointer-events-auto">
          <Header />
          <FilterBar />
        </div>
      </div>

      <CafeSheet />
      <BottomNav />
    </>
  );
}
