import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCommerceStore } from "./commerceStore";

import { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitialized: boolean;
  setUser: (user: User | null, accessToken: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      accessToken: null,
      isInitialized: false,
      setUser: (user, accessToken) => set({ user, accessToken }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      logout: async () => {
        console.log("[AuthStore] [DIAGNOSTIC] logout called");

        if (typeof window !== 'undefined') {
          try {
            // 1. Attempt server-side revocation with a 5s timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch("/api/auth/logout", {
              method: "POST",
              headers: {
                'Content-Type': 'application/json',
              },
              signal: controller.signal,
            });

            if (!response.ok) {
              console.error("[AuthStore] Server-side logout failed with status", response.status);
            }

            clearTimeout(timeoutId);
          } catch (error) {
            console.error("[AuthStore] Error during logout API call", error);
          } finally {
            // 2. Clear client-state regardless of API success
            set({ user: null, accessToken: null, isInitialized: true });

            console.log("[AuthStore] [DIAGNOSTIC] Clearing storages and redirecting to /login");

            try {
              useCommerceStore.getState().clearCart();
              useCommerceStore.getState().setWishlist([]);
            } catch (e) {
              console.error("Error clearing commerce store", e);
            }

            localStorage.clear();
            sessionStorage.clear();

            // 3. Hard redirect to ensure all memory state is purged
            window.location.href = "/login";
          }
        } else {
          // Fallback for non-window environments if ever called
          set({ user: null, accessToken: null, isInitialized: true });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isInitialized = false;
        }
      },
    }
  )
);
