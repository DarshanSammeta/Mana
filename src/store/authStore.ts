import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCommerceStore } from "./commerceStore";

import { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitialized: boolean;
  isLoggingOut: boolean;
  setUser: (user: User | null, accessToken: string | null) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isInitialized: false,
      isLoggingOut: false,
      setUser: (user, accessToken) => set({ user, accessToken }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      logout: async () => {
        // Prevent concurrent logout calls from triggering multiple redirects/clears
        if (get().isLoggingOut) {
            console.log("[AuthStore] Logout already in progress, skipping redundant call.");
            return;
        }

        console.log("[AuthStore] [DIAGNOSTIC] logout called");
        set({ isLoggingOut: true });

        // Safety timeout to reset the flag in case window.location.href fails to trigger
        const resetTimeout = setTimeout(() => {
            if (get().isLoggingOut) {
                console.warn("[AuthStore] Logout flag reset via safety timeout.");
                set({ isLoggingOut: false });
            }
        }, 10000);

        if (typeof window !== 'undefined') {
          try {
            // 1. Attempt server-side revocation with a 3s timeout (tighter than before)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

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
            clearTimeout(resetTimeout);

            // 3. Hard redirect to ensure all memory state (and the isLoggingOut flag) is purged
            window.location.href = "/login";
          }
        } else {
          // Fallback for non-window environments if ever called
          set({ user: null, accessToken: null, isInitialized: true, isLoggingOut: false });
          clearTimeout(resetTimeout);
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
