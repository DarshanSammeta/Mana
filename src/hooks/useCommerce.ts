import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";
import { useCommerceStore } from "@/store/commerceStore";
import { toast } from "@/components/ui/use-toast";

export const useWishlist = () => {
  const { accessToken, user } = useAuthStore();
  const setWishlistStore = useCommerceStore((state) => state.setWishlist);

  return useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await apiClient.get("/wishlist");
      const items = res.data.items?.map((item: any) => ({
        targetId: item.targetId,
        type: item.type,
      })) || [];
      setWishlistStore(items);
      return res.data;
    },
    enabled: !!accessToken && !!user,
  });
};

export const useToggleWishlist = () => {
  const queryClient = useQueryClient();
  const toggleWishlistStore = useCommerceStore((state) => state.toggleWishlist);

  return useMutation({
    mutationFn: async ({ type, targetId }: { type: string; targetId: string }) => {
      const res = await apiClient.post("/wishlist", { type, targetId });
      return res.data;
    },
    onMutate: async ({ targetId, type }) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });
      const previousWishlist = queryClient.getQueryData(["wishlist"]);

      // Optimistically update store
      toggleWishlistStore({ targetId, type });

      return { previousWishlist };
    },
    onError: (err, variables, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(["wishlist"], context.previousWishlist);
        // Rollback Zustand store
        toggleWishlistStore({ targetId: variables.targetId, type: variables.type });
      }
      toast({
        title: "Error updating wishlist",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast({
        title: data.action === "added" ? "Added to wishlist" : "Removed from wishlist",
      });
    },
  });
};

export const useCart = () => {
  const { accessToken, user } = useAuthStore();
  const setCartStore = useCommerceStore((state) => state.setCart);

  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await apiClient.get("/cart");
      const items = res.data.items || [];
      setCartStore(items);
      return res.data;
    },
    enabled: !!accessToken && !!user,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const addToCartStore = useCommerceStore((state) => state.addToCart);

  return useMutation({
    mutationFn: async ({ type, targetId, quantity }: { type: string; targetId: string; quantity?: number }) => {
      const res = await apiClient.post("/cart", { type, targetId, quantity });
      return res.data;
    },
    onMutate: async (newItem) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["cart"] });

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(["cart"]);

      // Optimistically update
      addToCartStore({
        id: "temp-id-" + Date.now(),
        type: newItem.type as "SERVICE" | "PACKAGE",
        targetId: newItem.targetId,
        quantity: newItem.quantity || 1,
      });

      return { previousCart };
    },
    onError: (err, newItem, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
      toast({
        title: "Failed to add to cart",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Added to cart" });
    },
  });
};

export const useRemoveFromCart = () => {
  const queryClient = useQueryClient();
  const removeFromCartStore = useCommerceStore((state) => state.removeFromCart);

  return useMutation({
    mutationFn: async (itemId?: string) => {
      const url = itemId ? `/cart?itemId=${itemId}` : "/cart";
      const res = await apiClient.delete(url);
      return res.data;
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previousCart = queryClient.getQueryData(["cart"]);

      if (itemId) {
        removeFromCartStore(itemId);
      } else {
        useCommerceStore.getState().clearCart();
      }

      return { previousCart };
    },
    onError: (err, itemId, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["cart"], context.previousCart);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Cart updated" });
    },
  });
};

