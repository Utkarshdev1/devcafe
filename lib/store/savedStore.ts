import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cafe } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface SavedState {
  savedCafes: Cafe[];
  savedIds: string[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  toggle: (cafe: Cafe) => void;
  toggleAndSync: (cafe: Cafe, userId: string) => Promise<void>;
  syncFromSupabase: (userId: string) => Promise<void>;
  isSaved: (id: string) => boolean;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedCafes: [],
      savedIds: [],
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      isSaved: (id) => get().savedCafes.some((c) => c.id === id),

      toggle: (cafe) => {
        const { savedCafes } = get();
        const exists = savedCafes.some((c) => c.id === cafe.id);
        const next = exists
          ? savedCafes.filter((c) => c.id !== cafe.id)
          : [...savedCafes, cafe];
        set({ savedCafes: next, savedIds: next.map((c) => c.id) });
      },

      // Toggle + sync to Supabase when user is logged in
      toggleAndSync: async (cafe, userId) => {
        get().toggle(cafe);
        const isNowSaved = get().isSaved(cafe.id);
        try {
          const supabase = createClient();
          if (isNowSaved) {
            await supabase.from('saved_cafes').upsert(
              { user_id: userId, osm_id: cafe.id, cafe_data: cafe },
              { onConflict: 'user_id,osm_id' }
            );
          } else {
            await supabase.from('saved_cafes')
              .delete()
              .eq('user_id', userId)
              .eq('osm_id', cafe.id);
          }
        } catch (err) {
          console.error('[savedStore] toggleAndSync failed:', err);
        }
      },

      // Called on login — merges Supabase saves with localStorage
      syncFromSupabase: async (userId) => {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from('saved_cafes')
            .select('cafe_data')
            .eq('user_id', userId);

          const remote: Cafe[] = (data ?? []).map((r) => r.cafe_data as Cafe);
          const local = get().savedCafes;
          const remoteIds = new Set(remote.map((c) => c.id));

          // Merge: remote wins for duplicates, local-only items are pushed up
          const merged = [
            ...remote,
            ...local.filter((c) => !remoteIds.has(c.id)),
          ];
          set({ savedCafes: merged, savedIds: merged.map((c) => c.id) });

          // Push any local-only saves up to Supabase
          const localOnly = local.filter((c) => !remoteIds.has(c.id));
          if (localOnly.length > 0) {
            await supabase.from('saved_cafes').upsert(
              localOnly.map((cafe) => ({
                user_id: userId,
                osm_id: cafe.id,
                cafe_data: cafe,
              })),
              { onConflict: 'user_id,osm_id' }
            );
          }

        } catch (err) {
          console.error('[savedStore] syncFromSupabase failed:', err);
        }
      },
    }),
    {
      name: 'devcafe-saved',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state) state.savedIds = state.savedCafes.map((c) => c.id);
      },
    }
  )
);
