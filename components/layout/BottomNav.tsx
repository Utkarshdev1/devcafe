'use client';

import { Map, Search, Heart, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', icon: Map, label: 'Map' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/saved', icon: Heart, label: 'Saved' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-xl border-t border-zinc-100">
      <div className="flex items-center justify-around px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-5 py-1 rounded-xl transition-colors',
                isActive ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              <Icon
                className="w-5 h-5"
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span
                className={cn(
                  'text-[10px]',
                  isActive ? 'font-bold' : 'font-medium'
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
