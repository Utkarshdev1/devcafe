'use client';

import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { Cafe } from '@/types';
import { useCafeStore } from '@/lib/store/cafeStore';
import { formatRating } from '@/lib/utils';

interface CafeMarkerProps {
  cafe: Cafe;
  onClick: () => void;
}

function buildIcon(isSelected: boolean, name: string, rating: number): L.DivIcon {
  if (isSelected) {
    const short = name.split(' ').slice(0, 2).join(' ');
    return L.divIcon({
      html: `<div style="
        display:inline-flex;align-items:center;gap:4px;
        background:#18181b;color:#fff;
        border-radius:999px;padding:5px 10px 5px 8px;
        font-size:11px;font-weight:700;line-height:1;
        box-shadow:0 4px 16px rgba(0,0,0,0.28);
        border:1.5px solid #27272a;white-space:nowrap;
        font-family:system-ui,-apple-system,sans-serif;
      ">
        <span>☕</span>
        <span style="max-width:96px;overflow:hidden;text-overflow:ellipsis">${short}</span>
        <span style="color:#fbbf24;font-size:10px;margin-left:2px">${formatRating(rating)}</span>
      </div>`,
      className: '',
      iconSize: [160, 30],
      iconAnchor: [80, 15],
    });
  }

  const border = rating >= 4.5 ? '#fbbf24' : '#d4d4d8';
  return L.divIcon({
    html: `<div style="
      width:32px;height:32px;
      background:#fff;border:2px solid ${border};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;cursor:pointer;
      box-shadow:0 2px 8px rgba(0,0,0,0.15);
    ">☕</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export function CafeMarker({ cafe, onClick }: CafeMarkerProps) {
  const selectedCafe = useCafeStore((s) => s.selectedCafe);
  const isSelected = selectedCafe?.id === cafe.id;

  return (
    <Marker
      position={[cafe.lat, cafe.lng]}
      icon={buildIcon(isSelected, cafe.name, cafe.rating)}
      zIndexOffset={isSelected ? 1000 : 0}
      eventHandlers={{ click: onClick }}
    />
  );
}
