import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SavedState {
  savedIds: string[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      toggle: (id) => {
        const { savedIds } = get();
        set({
          savedIds: savedIds.includes(id)
            ? savedIds.filter((s) => s !== id)
            : [...savedIds, id],
        });
      },
      isSaved: (id) => get().savedIds.includes(id),
    }),
    {
      name: 'devcafe-saved',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
