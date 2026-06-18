'use client';

import { Wifi, Zap, Volume2, Coffee, Leaf, Car, Utensils, X, type LucideIcon } from 'lucide-react';
import { useCafeStore } from '@/lib/store/cafeStore';
import { type Amenity } from '@/types';
import { cn } from '@/lib/utils';

const FILTERS: { amenity: Amenity; icon: LucideIcon; label: string }[] = [
  { amenity: 'wifi',            icon: Wifi,     label: 'WiFi'    },
  { amenity: 'power_outlets',   icon: Zap,      label: 'Power'   },
  { amenity: 'quiet_zone',      icon: Volume2,  label: 'Quiet'   },
  { amenity: 'good_coffee',     icon: Coffee,   label: 'Coffee'  },
  { amenity: 'outdoor_seating', icon: Leaf,     label: 'Outdoor' },
  { amenity: 'parking',         icon: Car,      label: 'Parking' },
  { amenity: 'food',            icon: Utensils, label: 'Food'    },
];

export function FilterBar() {
  const { filter, setFilter, resetFilter } = useCafeStore();
  const active = filter.amenities;

  const toggle = (amenity: Amenity) =>
    setFilter({
      amenities: active.includes(amenity)
        ? active.filter((a) => a !== amenity)
        : [...active, amenity],
    });

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-4 pb-3">
      {active.length > 0 && (
        <button
          onClick={resetFilter}
          className="flex items-center gap-1 pl-2.5 pr-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap bg-zinc-900 text-white flex-shrink-0 shadow-sm"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}

      {FILTERS.map(({ amenity, icon: Icon, label }) => {
        const isActive = active.includes(amenity);
        return (
          <button
            key={amenity}
            onClick={() => toggle(amenity)}
            className={cn(
              'flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0',
              'border transition-all duration-150 shadow-sm',
              isActive
                ? 'bg-zinc-900 border-zinc-900 text-white'
                : 'bg-white/90 backdrop-blur-sm border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-white'
            )}
          >
            <Icon className="w-3 h-3" strokeWidth={2.5} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
