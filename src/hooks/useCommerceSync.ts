import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCommerceStore } from "@/store/commerceStore";
import { useCart, useWishlist } from "@/hooks/useCommerce";
import apiClient from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

export const useCommerceSync = () => {
  const accessToken = useAuthStore(state => state.accessToken);
  const user = useAuthStore(state => state.user);
  const cart = useCommerceStore(state => state.cart);
  const wishlist = useCommerceStore(state => state.wishlist);

  const { toast } = useToast();
  const [isMerging, setIsMerging] = useState(false);
  const [hasAttemptedMerge, setHasAttemptedMerge] = useState(false);

  // Queries will run automatically when accessToken is available
  const { refetch: refetchCart } = useCart();
  const { refetch: refetchWishlist } = useWishlist();

  useEffect(() => {
    const mergeData = async () => {
      // Only merge if we have a user, an access token, haven't merged this session,
      // and there's actually guest data to merge.
      if (user && accessToken && !hasAttemptedMerge && (cart.length > 0 || wishlist.length > 0)) {
        setIsMerging(true);
        try {
          await apiClient.post(
            "/commerce/merge",
            {
              cartItems: cart.map(item => ({
                targetId: item.targetId,
                type: item.type,
                quantity: item.quantity
              })),
              wishlistItems: wishlist.map(item => ({
                targetId: item.targetId,
                type: item.type
              }))
            }
          );

          toast({
            title: "Success",
            description: "Your saved items have been synchronized.",
          });

          // After successful merge, we can clear local guest data
          // (Refetching will populate the store with server data)
          await Promise.all([refetchCart(), refetchWishlist()]);

          setHasAttemptedMerge(true);
        } catch (error) {
          console.error("Failed to merge commerce data:", error);
          // If 401/403, we might want to stop trying but keep the data
          const status = (error as any)?.response?.status;
          if (status === 401 || status === 403) {
             setHasAttemptedMerge(true);
          }
        } finally {
          setIsMerging(false);
        }
      } else if (user && accessToken && !hasAttemptedMerge) {
          // If no data to merge, we still need to fetch the server-side data
          await Promise.all([refetchCart(), refetchWishlist()]);
          setHasAttemptedMerge(true);
      }
    };

    mergeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user, hasAttemptedMerge, toast]);

  return { isMerging };
};

