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
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      accessToken: null,
      isInitialized: false,
      setUser: (user, accessToken) => set({ user, accessToken }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      logout: () => {
        set({ user: null, accessToken: null, isInitialized: true });
        // Clear commerce store on logout
        useCommerceStore.getState().clearCart();
        useCommerceStore.getState().setWishlist([]);

        // Clear all storages to be safe
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          // Redirect to login
          window.location.href = "/login";
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
