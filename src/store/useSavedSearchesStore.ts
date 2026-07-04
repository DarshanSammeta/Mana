import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SavedSearch {
  id: string;
  name: string;
  url: string;
  timestamp: number;
  filters: Record<string, string>;
}

interface SavedSearchesState {
  savedSearches: SavedSearch[];
  saveSearch: (name: string, url: string, filters: Record<string, string>) => void;
  removeSearch: (id: string) => void;
  clearSearches: () => void;
}

export const useSavedSearchesStore = create<SavedSearchesState>()(
  persist(
    (set, get) => ({
      savedSearches: [],
      saveSearch: (name, url, filters) => {
        const { savedSearches } = get();
        const newSearch: SavedSearch = {
          id: Math.random().toString(36).substring(2, 9),
          name,
          url,
          filters,
          timestamp: Date.now(),
        };
        set({ savedSearches: [newSearch, ...savedSearches].slice(0, 10) });
      },
      removeSearch: (id) => {
        set({ savedSearches: get().savedSearches.filter((s) => s.id !== id) });
      },
      clearSearches: () => set({ savedSearches: [] }),
    }),
    {
      name: 'saved-searches-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
