import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SavedState {
  savedIds: string[];
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedIds: [],
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
    { name: 'devcafe-saved' }
  )
);
