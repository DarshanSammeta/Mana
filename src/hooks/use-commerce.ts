"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { useCommerceStore } from "@/store/commerceStore";
import { toast } from "@/components/ui/use-toast";

export const useWishlist = () => {
  const user = useAuthStore(state => state.user);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const setWishlistStore = useCommerceStore((state) => state.setWishlist);
  const localWishlist = useCommerceStore((state) => state.wishlist);

  return useQuery({
    queryKey: ["wishlist", user?.id || "guest"],
    queryFn: async () => {
      const res = await apiClient.get("/wishlist");
      const items = res.data.items?.map((item: any) => ({
        targetId: item.targetId,
        type: item.type,
      })) || [];
      setWishlistStore(items);
      return res.data;
    },
    enabled: isInitialized && !!user,
    initialData: !user ? { items: localWishlist } : undefined,
  });
};

export const useCart = () => {
  const user = useAuthStore(state => state.user);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const setCartStore = useCommerceStore((state) => state.setCart);
  const localCart = useCommerceStore((state) => state.cart);

  return useQuery({
    queryKey: ["cart", user?.id || "guest"],
    queryFn: async () => {
      const res = await apiClient.get("/cart");
      const items = res.data.items || [];
      setCartStore(items);
      return res.data;
    },
    enabled: isInitialized && !!user,
    initialData: !user ? { items: localCart } : undefined,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
};

export const useIsInCart = (vendorId: string, packageId?: string) => {
  const { data: cart } = useCart();
  if (!cart?.items) return false;

  return cart.items.some((item: any) => {
      const matchesVendor = item.vendorId === vendorId || item.details?.vendorId === vendorId;
      const matchesPackage = packageId ? (item.packageId === packageId || item.targetId === packageId) : true;
      return matchesVendor && matchesPackage;
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const addToCartStore = useCommerceStore((state) => state.addToCart);

  return useMutation({
    mutationFn: async (params: {
        type: string;
        targetId: string;
        quantity?: number;
        vendorId?: string;
        packageId?: string;
        eventDate?: string;
        guestCount?: number;
        location?: string;
        metadata?: any; // For high-fidelity local UI state
    }) => {
      if (user) {
        const res = await apiClient.post("/cart", params);
        return res.data;
      }
      return { success: true, guest: true };
    },
    onMutate: async (newItem) => {
      const queryKey = ["cart", user?.id || "guest"];
      await queryClient.cancelQueries({ queryKey });

      const previousCart = queryClient.getQueryData(queryKey) as any;

      // Update local Zustand store
      addToCartStore({
        id: "temp-" + Date.now(),
        type: newItem.type as "SERVICE" | "PACKAGE",
        targetId: newItem.targetId,
        quantity: newItem.quantity || 1,
        details: {
            ...newItem.metadata,
            vendorId: newItem.vendorId,
            packageId: newItem.packageId
        }
      });

      // Optimistically update React Query cache
      if (previousCart) {
          const updatedItems = [...(previousCart.items || [])];
          const existingIndex = updatedItems.findIndex(i => i.targetId === newItem.targetId && i.type === newItem.type);

          const itemData = {
              ...newItem,
              id: "temp-" + Date.now(),
              quantity: newItem.quantity || 1,
              details: {
                  ...newItem.metadata,
                  vendorId: newItem.vendorId,
                  packageId: newItem.packageId
              }
          };

          if (existingIndex > -1) {
              updatedItems[existingIndex] = { ...updatedItems[existingIndex], quantity: (updatedItems[existingIndex].quantity || 0) + (newItem.quantity || 1) };
          } else {
              updatedItems.push(itemData);
          }

          queryClient.setQueryData(queryKey, { ...previousCart, items: updatedItems });
      }

      return { previousCart };
    },
    onError: (err, newItem, context) => {
      const queryKey = ["cart", user?.id || "guest"];
      if (context?.previousCart) {
        queryClient.setQueryData(queryKey, context.previousCart);
      }
      toast({
        title: "Failed to add to cart",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      if (user) {
        const queryKey = ["cart", user.id];
        queryClient.invalidateQueries({ queryKey });
      }
      toast({ title: "Service added to cart" });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const removeFromCartStore = useCommerceStore((state) => state.removeFromCart);

  return useMutation({
    mutationFn: async (itemId?: string) => {
      if (user) {
        const url = itemId ? `/cart?itemId=${itemId}` : "/cart";
        const res = await apiClient.delete(url);
        return res.data;
      }
      return { success: true, guest: true };
    },
    onMutate: async (itemId) => {
      const queryKey = ["cart", user?.id || "guest"];
      await queryClient.cancelQueries({ queryKey });
      const previousCart = queryClient.getQueryData(queryKey) as any;

      if (itemId) {
        removeFromCartStore(itemId);
      } else {
        useCommerceStore.getState().clearCart();
      }

      if (previousCart) {
          const updatedItems = itemId ? previousCart.items.filter((i: any) => i.id !== itemId) : [];
          queryClient.setQueryData(queryKey, { ...previousCart, items: updatedItems });
      }
      return { previousCart };
    },
    onSuccess: () => {
      const queryKey = ["cart", user?.id || "guest"];
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Cart updated" });
    },
  });
};

export const useToggleWishlist = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const toggleWishlistStore = useCommerceStore((state) => state.toggleWishlist);

  return useMutation({
    mutationFn: async (params: { targetId: string; type: string }) => {
      if (user) {
        const res = await apiClient.post("/wishlist/toggle", params);
        return res.data;
      }
      return { success: true, guest: true };
    },
    onMutate: async (newItem) => {
      const queryKey = ["wishlist", user?.id || "guest"];
      await queryClient.cancelQueries({ queryKey });
      const previousWishlist = queryClient.getQueryData(queryKey) as any;

      toggleWishlistStore(newItem);

      if (previousWishlist) {
        const updatedItems = [...(previousWishlist.items || [])];
        const exists = updatedItems.some(i => i.targetId === newItem.targetId && i.type === newItem.type);

        let newItems;
        if (exists) {
          newItems = updatedItems.filter(i => !(i.targetId === newItem.targetId && i.type === newItem.type));
        } else {
          newItems = [...updatedItems, newItem];
        }

        queryClient.setQueryData(queryKey, { ...previousWishlist, items: newItems });
      }
      return { previousWishlist };
    },
    onSuccess: () => {
      const queryKey = ["wishlist", user?.id || "guest"];
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
