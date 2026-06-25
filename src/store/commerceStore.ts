import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  id: string;
  type: "SERVICE" | "PACKAGE";
  targetId: string;
  quantity: number;
  details?: any; // To store title, price, etc. for instant UI feedback
}

interface WishlistItem {
  targetId: string;
  type: string;
}

interface CommerceState {
  cart: CartItem[];
  wishlist: WishlistItem[];
  isMerged: boolean;
  setCart: (items: CartItem[]) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setWishlist: (items: WishlistItem[]) => void;
  toggleWishlist: (item: WishlistItem) => void;
  setMerged: (val: boolean) => void;
}

export const useCommerceStore = create<CommerceState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      isMerged: false,
      setCart: (items) => set({ cart: items }),
      addToCart: (item) =>
        set((state) => {
          const existing = state.cart.find((i) => i.targetId === item.targetId && i.type === item.type);
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.targetId === item.targetId && i.type === item.type
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { cart: [...state.cart, item] };
        }),
      removeFromCart: (itemId) =>
        set((state) => ({
          cart: state.cart.filter((i) => i.id !== itemId),
        })),
      updateQuantity: (itemId, quantity) =>
        set((state) => ({
          cart: state.cart.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
        })),
      clearCart: () => set({ cart: [] }),
      setWishlist: (items) => set({ wishlist: items }),
      toggleWishlist: (item) =>
        set((state) => {
          const exists = state.wishlist.some(
            (i) => i.targetId === item.targetId && i.type === item.type
          );
          if (exists) {
            return {
              wishlist: state.wishlist.filter(
                (i) => !(i.targetId === item.targetId && i.type === item.type)
              ),
            };
          }
          return { wishlist: [...state.wishlist, item] };
        }),
      setMerged: (val) => set({ isMerged: val }),
    }),
    {
      name: "mana-commerce-storage",
    }
  )
);
