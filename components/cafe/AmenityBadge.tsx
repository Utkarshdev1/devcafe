import { Wifi, Zap, Volume2, Coffee, Leaf, Car, Utensils, type LucideIcon } from 'lucide-react';
import { Amenity } from '@/types';
import { cn } from '@/lib/utils';

const AMENITY_CONFIG: Record<Amenity, { icon: LucideIcon; label: string }> = {
  wifi:             { icon: Wifi,     label: 'WiFi'          },
  power_outlets:    { icon: Zap,      label: 'Power Outlets' },
  quiet_zone:       { icon: Volume2,  label: 'Quiet Zone'    },
  good_coffee:      { icon: Coffee,   label: 'Great Coffee'  },
  outdoor_seating:  { icon: Leaf,     label: 'Outdoor'       },
  parking:          { icon: Car,      label: 'Parking'       },
  food:             { icon: Utensils, label: 'Food'          },
};

interface AmenityBadgeProps {
  amenity: Amenity;
  small?: boolean;
}

export function AmenityBadge({ amenity, small }: AmenityBadgeProps) {
  const { icon: Icon, label } = AMENITY_CONFIG[amenity];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg font-medium border border-zinc-200 bg-zinc-50 text-zinc-700',
        small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
      )}
    >
      <Icon className={small ? 'w-2.5 h-2.5' : 'w-3 h-3'} strokeWidth={2.5} />
      {label}
    </span>
  );
}
