import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCommerceStore } from "@/store/commerceStore";
import { useCart, useWishlist } from "@/hooks/useCommerce";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

export const useCommerceSync = () => {
  const { accessToken, user } = useAuthStore();
  const { cart, wishlist, clearCart, setWishlist } = useCommerceStore();
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
          await axios.post(
            "/api/commerce/merge",
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
            },
            {
              headers: { Authorization: `Bearer ${accessToken}` }
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
          // We don't clear local data on failure so user doesn't lose it
        } finally {
          setIsMerging(false);
        }
      } else if (user && accessToken && !hasAttemptedMerge) {
          // If no data to merge, still mark as attempted to prevent unnecessary checks
          setHasAttemptedMerge(true);
      }
    };

    mergeData();
  }, [accessToken, user, hasAttemptedMerge, refetchCart, refetchWishlist, toast]); // Removed cart/wishlist from deps to avoid loops

  return { isMerging };
};
