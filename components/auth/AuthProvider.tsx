'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { useSavedStore } from '@/lib/store/savedStore';

const AUTH_PATHS = ['/login', '/auth'];

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((p) => pathname.startsWith(p));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading } = useAuthStore();
  const { syncFromSupabase } = useSavedStore();
  const router = useRouter();

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function fetchProfile(userId: string) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data ?? null);
    }

    // Seed initial session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setUser(user);
      setLoading(false);
      if (user) {
        fetchProfile(user.id);
        syncFromSupabase(user.id);
        if (isAuthPath(window.location.pathname)) router.replace('/');
      } else {
        // No session — send to login
        if (!isAuthPath(window.location.pathname)) router.replace('/login');
      }
    });

    // Keep store in sync as auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;
        setUser(user);
        if (user) {
          fetchProfile(user.id);
          syncFromSupabase(user.id);
          if (isAuthPath(window.location.pathname)) router.replace('/');
        } else {
          setProfile(null);
          if (!isAuthPath(window.location.pathname)) router.replace('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
