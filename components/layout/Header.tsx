'use client';

import { Search, SlidersHorizontal, LogIn } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, profile } = useAuthStore();
  const router = useRouter();

  const handleProfileClick = () => {
    router.push(user ? '/profile' : '/login');
  };

  const fullName =
    profile?.full_name ||
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    null;

  const initials = fullName
    ? fullName.trim().split(/\s+/).map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() ?? null;

  const avatarUrl =
    profile?.avatar_url || (user?.user_metadata?.avatar_url as string) || null;

  return (
    <div className="px-4 pt-safe pt-4 pb-2">
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-2xl rounded-2xl border border-zinc-200/60 shadow-[0_2px_16px_rgba(0,0,0,0.08)] px-4 py-3">
        {/* Brand */}
        <Link href="/" className="font-black text-zinc-900 text-[15px] tracking-tight select-none shrink-0">
          Dev<span className="text-amber-600">Café</span>
        </Link>

        {/* Search bar */}
        <button className="flex-1 flex items-center gap-2 ml-2 bg-zinc-100 hover:bg-zinc-200/70 transition-colors rounded-xl px-3 py-2 text-left">
          <Search className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" strokeWidth={2.5} />
          <span className="text-zinc-400 text-xs font-medium truncate">Search cafés in Pune…</span>
        </button>

        {/* Filter */}
        <button
          aria-label="Filters"
          className="p-2 rounded-xl hover:bg-zinc-100 active:bg-zinc-200 transition-colors shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4 text-zinc-700" strokeWidth={2} />
        </button>

        {/* Profile / Login */}
        <button
          onClick={handleProfileClick}
          aria-label={user ? 'Account' : 'Sign in'}
          className="shrink-0 p-1 rounded-xl hover:bg-zinc-100 active:bg-zinc-200 transition-colors"
        >
          {user && avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Profile" className="w-7 h-7 rounded-full object-cover" />
          ) : user && initials ? (
            <div className="w-7 h-7 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center">
              {initials}
            </div>
          ) : (
            <LogIn className="w-4 h-4 text-zinc-700" strokeWidth={2} />
          )}
        </button>
      </div>
    </div>
  );
}
