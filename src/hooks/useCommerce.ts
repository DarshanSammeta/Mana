import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useCommerceStore } from "@/store/commerceStore";
import { toast } from "@/components/ui/use-toast";

export const useWishlist = () => {
  const { accessToken } = useAuthStore();
  const setWishlistStore = useCommerceStore((state) => state.setWishlist);

  return useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await axios.get("/api/wishlist", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const items = res.data.items?.map((item: any) => ({
        targetId: item.targetId,
        type: item.type,
      })) || [];
      setWishlistStore(items);
      return res.data;
    },
    enabled: !!accessToken,
  });
};

export const useToggleWishlist = () => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const toggleWishlistStore = useCommerceStore((state) => state.toggleWishlist);

  return useMutation({
    mutationFn: async ({ type, targetId }: { type: string; targetId: string }) => {
      const res = await axios.post(
        "/api/wishlist",
        { type, targetId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return res.data;
    },
    onMutate: async ({ targetId, type }) => {
      await queryClient.cancelQueries({ queryKey: ["wishlist"] });
      toggleWishlistStore({ targetId, type });
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
  const { accessToken } = useAuthStore();
  const setCartStore = useCommerceStore((state) => state.setCart);

  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await axios.get("/api/cart", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const items = res.data.items || [];
      setCartStore(items);
      return res.data;
    },
    enabled: !!accessToken,
  });
};

export const useAddToCart = () => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, targetId, quantity }: { type: string; targetId: string; quantity?: number }) => {
      const res = await axios.post(
        "/api/cart",
        { type, targetId, quantity },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Added to cart" });
    },
  });
};

export const useRemoveFromCart = () => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId?: string) => {
      const url = itemId ? `/api/cart?itemId=${itemId}` : "/api/cart";
      const res = await axios.delete(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Cart updated" });
    },
  });
};
