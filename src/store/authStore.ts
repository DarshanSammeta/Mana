import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCommerceStore } from "./commerceStore";

interface User {
  id: string;
  email: string;
  fullName: string;
  mobileNumber: string;
  role: "CUSTOMER" | "VENDOR";
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setUser: (user: User | null, accessToken: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user, accessToken) => set({ user, accessToken }),
      logout: () => {
        set({ user: null, accessToken: null });
        // Clear commerce store on logout
        useCommerceStore.getState().clearCart();
        useCommerceStore.getState().setWishlist([]);
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
