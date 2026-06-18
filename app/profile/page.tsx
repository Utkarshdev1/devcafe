'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Bookmark, Star, Share2, Smartphone, X, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useSavedStore } from '@/lib/store/savedStore';
import { createClient } from '@/lib/supabase/client';
import { BottomNav } from '@/components/layout/BottomNav';

const APP_URL = 'https://devcafe-gray.vercel.app';

function getDisplayName(profile: { full_name?: string | null; username?: string | null } | null, user: { user_metadata?: Record<string, unknown>; email?: string | null } | null): string {
  return (
    profile?.full_name ||
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    profile?.username ||
    user?.email?.split('@')[0] ||
    'User'
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function InstallSheet({ onClose }: { onClose: () => void }) {
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);

  const iosSteps = [
    'Open this link in Safari (not Chrome or other browsers)',
    'Tap the Share icon at the bottom of the screen',
    'Scroll down and tap "Add to Home Screen"',
    'Tap "Add" in the top-right corner',
  ];
  const androidSteps = [
    'Open this link in Chrome',
    'Tap the menu (⋮) in the top-right corner',
    'Tap "Add to Home screen"',
    'Tap "Install" or "Add"',
  ];

  const showIOS = isIOS || (!isAndroid && !isIOS);
  const showAndroid = isAndroid || (!isAndroid && !isIOS);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-[24px] px-5 pt-5 pb-[max(28px,env(safe-area-inset-bottom,0px))] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="DevCafé" className="w-11 h-11 rounded-[14px]" />
            <div>
              <p className="font-bold text-zinc-900">Install DevCafé</p>
              <p className="text-xs text-zinc-400 mt-0.5">Works like a native app</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-zinc-100 active:bg-zinc-200">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {showIOS && (
          <div className="mb-5">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-3">
              iPhone / iPad
            </p>
            <div className="flex flex-col gap-3.5">
              {iosSteps.map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-[10px] font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-zinc-700 leading-snug pt-0.5">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {showAndroid && (
          <div className={showIOS && !isAndroid ? 'border-t border-zinc-100 pt-5' : ''}>
            {(!isIOS && !isAndroid) && (
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-3">
                Android
              </p>
            )}
            <div className="flex flex-col gap-3.5">
              {androidSteps.map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-[10px] font-bold">{i + 1}</span>
                  </div>
                  <p className="text-sm text-zinc-700 leading-snug pt-0.5">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-semibold active:bg-zinc-800"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, profile, clear } = useAuthStore();
  const { savedIds } = useSavedStore();
  const router = useRouter();
  const [showInstall, setShowInstall] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reviewCount, setReviewCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setReviewCount(count ?? 0));
  }, [user]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DevCafé',
          text: 'Find the best dev-friendly cafés — WiFi speed, power outlets & noise level rated by devs.',
          url: APP_URL,
        });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    clear();
    router.push('/login');
  };

  const displayName = getDisplayName(profile, user);
  const initials = getInitials(displayName);
  const avatarUrl = profile?.avatar_url || (user?.user_metadata?.avatar_url as string) || null;

  if (!user) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 pb-20">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center">
            <span className="text-2xl text-zinc-400 font-bold">?</span>
          </div>
          <div className="text-center">
            <p className="font-bold text-zinc-900 mb-1">Not signed in</p>
            <p className="text-sm text-zinc-500">Sign in to write reviews and save cafés</p>
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

  return (
    <>
      <div className="flex flex-col h-screen bg-zinc-50">
        {/* Hero */}
        <div className="flex-shrink-0 bg-zinc-900 px-5 pt-[max(56px,env(safe-area-inset-top,0px))] pb-6">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-white/20 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 ring-2 ring-white/20">
                <span className="text-white text-xl font-black">{initials}</span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-white font-bold text-lg leading-tight truncate">{displayName}</h1>
              <p className="text-zinc-400 text-sm truncate mt-0.5">{user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-5">
            <div className="flex-1 bg-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-white font-bold text-lg leading-none">{savedIds.length}</span>
              </div>
              <span className="text-zinc-400 text-[11px] font-medium">Saved cafés</span>
            </div>
            <div className="flex-1 bg-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-white font-bold text-lg leading-none">
                  {reviewCount === null ? '—' : reviewCount}
                </span>
              </div>
              <span className="text-zinc-400 text-[11px] font-medium">Reviews written</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-24 px-4 pt-5 flex flex-col gap-3">
          {/* Share section */}
          <div className="bg-white rounded-2xl overflow-hidden">
            <p className="px-4 pt-3 pb-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
              Share
            </p>
            <button
              onClick={handleShare}
              className="flex items-center justify-between w-full px-4 py-3.5 active:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-zinc-900">
                    {copied ? 'Link copied!' : 'Share DevCafé'}
                  </p>
                  <p className="text-xs text-zinc-400">Invite friends to discover great spots</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300 flex-shrink-0" />
            </button>

            <div className="h-px bg-zinc-100 mx-4" />

            <button
              onClick={() => setShowInstall(true)}
              className="flex items-center justify-between w-full px-4 py-3.5 active:bg-zinc-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-zinc-900">Add to Home Screen</p>
                  <p className="text-xs text-zinc-400">Install as an app on your phone</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300 flex-shrink-0" />
            </button>
          </div>

          {/* Account section */}
          <div className="bg-white rounded-2xl overflow-hidden">
            <p className="px-4 pt-3 pb-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
              Account
            </p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3.5 active:bg-zinc-50 transition-colors"
            >
              <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-sm font-semibold text-red-500">Sign out</span>
            </button>
          </div>

          {/* App version */}
          <p className="text-center text-[11px] text-zinc-300 mt-1">DevCafé v1.0 · Pune</p>
        </div>

        <BottomNav />
      </div>

      {showInstall && <InstallSheet onClose={() => setShowInstall(false)} />}
    </>
  );
}
