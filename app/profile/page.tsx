'use client';

import { useRouter } from 'next/navigation';
import { User, LogOut, Bookmark, Star } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useSavedStore } from '@/lib/store/savedStore';
import { createClient } from '@/lib/supabase/client';
import { BottomNav } from '@/components/layout/BottomNav';

export default function ProfilePage() {
  const { user, profile, clear } = useAuthStore();
  const { savedIds } = useSavedStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore — clear local state regardless
    }
    clear();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 pb-20">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-zinc-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-zinc-900 mb-1">Not signed in</p>
            <p className="text-sm text-zinc-500">
              Sign in to write reviews and sync your saved cafés
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="bg-zinc-900 text-white rounded-2xl px-7 py-3 text-sm font-semibold"
          >
            Sign in
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const displayName = profile?.full_name || profile?.username || 'Dev';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-14 pb-4 border-b border-zinc-100">
        <h1 className="text-xl font-bold text-zinc-900">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* User info */}
        <div className="flex items-center gap-4 px-4 py-5 border-b border-zinc-100">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg font-bold">{initials}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-zinc-900 truncate">{displayName}</p>
            <p className="text-sm text-zinc-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex divide-x divide-zinc-100 border-b border-zinc-100">
          <div className="flex-1 flex flex-col items-center py-5 gap-1">
            <div className="flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-zinc-400" />
              <span className="text-lg font-bold text-zinc-900">{savedIds.length}</span>
            </div>
            <span className="text-[11px] text-zinc-400 font-medium">Saved</span>
          </div>
          <div className="flex-1 flex flex-col items-center py-5 gap-1">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-zinc-400" />
              <span className="text-lg font-bold text-zinc-900">—</span>
            </div>
            <span className="text-[11px] text-zinc-400 font-medium">Reviews</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full py-3.5 text-red-500 active:opacity-70 transition-opacity"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-semibold">Sign out</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
