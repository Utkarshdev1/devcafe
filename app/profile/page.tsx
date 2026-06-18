'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Bookmark, Star, Share2, Smartphone, X, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { useSavedStore } from '@/lib/store/savedStore';
import { createClient } from '@/lib/supabase/client';
import { BottomNav } from '@/components/layout/BottomNav';

const APP_URL = 'https://devcafe-gray.vercel.app';
const APP_NAME = 'DevCafé';

function InstallSheet({ onClose }: { onClose: () => void }) {
  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid =
    typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-[1100] flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-[24px] px-5 pt-5 pb-[max(28px,env(safe-area-inset-bottom,0px))]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="DevCafé" className="w-10 h-10 rounded-[12px]" />
            <div>
              <p className="font-bold text-zinc-900 text-sm">Install DevCafé</p>
              <p className="text-xs text-zinc-400">Add to your home screen</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-zinc-100">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Steps */}
        {(isIOS || (!isAndroid && !isIOS)) && (
          <div className="mb-4">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-3">
              iPhone / iPad (Safari)
            </p>
            <div className="flex flex-col gap-3">
              {[
                { step: '1', text: 'Open this page in Safari (not Chrome)' },
                { step: '2', text: 'Tap the Share button at the bottom of the screen' },
                { step: '3', text: 'Scroll down and tap "Add to Home Screen"' },
                { step: '4', text: 'Tap "Add" — done!' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-[10px] font-bold">{step}</span>
                  </div>
                  <p className="text-sm text-zinc-700 leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(isAndroid || (!isAndroid && !isIOS)) && (
          <div className={!isIOS && !isAndroid ? 'border-t border-zinc-100 pt-4' : ''}>
            {!isIOS && !isAndroid && (
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-3">
                Android (Chrome)
              </p>
            )}
            {isAndroid && (
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-3">
                Android (Chrome)
              </p>
            )}
            <div className="flex flex-col gap-3">
              {[
                { step: '1', text: 'Open this page in Chrome' },
                { step: '2', text: 'Tap the menu (⋮) in the top-right corner' },
                { step: '3', text: 'Tap "Add to Home screen"' },
                { step: '4', text: 'Tap "Add" — done!' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-[10px] font-bold">{step}</span>
                  </div>
                  <p className="text-sm text-zinc-700 leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full bg-zinc-900 text-white rounded-2xl py-3.5 text-sm font-semibold"
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: APP_NAME,
          text: 'Find the best dev-friendly cafés near you — WiFi speed, outlets & noise level rated by devs.',
          url: APP_URL,
        });
      } catch {
        // user cancelled — ignore
      }
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
    <>
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

          {/* Share & Install */}
          <div className="px-4 pt-4 pb-2 border-b border-zinc-100">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-1">
              Share
            </p>
            <button
              onClick={handleShare}
              className="flex items-center justify-between w-full py-3.5 active:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-zinc-700" />
                <span className="text-sm font-semibold text-zinc-900">
                  {copied ? 'Link copied!' : 'Share DevCafé'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300" />
            </button>

            <button
              onClick={() => setShowInstall(true)}
              className="flex items-center justify-between w-full py-3.5 active:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-zinc-700" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-zinc-900">Add to Home Screen</p>
                  <p className="text-xs text-zinc-400">Install as an app on your phone</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-300" />
            </button>
          </div>

          {/* Sign out */}
          <div className="px-4 pt-2">
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

      {showInstall && <InstallSheet onClose={() => setShowInstall(false)} />}
    </>
  );
}
