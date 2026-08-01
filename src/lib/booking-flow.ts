import { QueryClient } from "@tanstack/react-query";
import { useCheckoutStore } from "@/store/checkoutStore";

/**
 * Centralized utility to reset the entire booking flow state.
 * Clears Zustand store and invalidates relevant React Query caches.
 */
export const resetBookingFlow = async (queryClient?: QueryClient) => {
  console.log("[DEBUG] resetBookingFlow triggered");

  // 1. Reset Zustand Checkout Store
  const resetCheckout = useCheckoutStore.getState().resetCheckout;
  resetCheckout();

  // 2. Invalidate React Query Cache for booking-related data
  if (queryClient) {
    const queryKeys = [
      "event-types",
      "categories",
      "subcategories",
      "serviceTypes",
      "packages",
      "packageAddons",
      "pricing",
      "availability",
      "vendors", // Marketplace vendors
      "marketplace" // Marketplace infinite queries
    ];

    console.log("[DEBUG] Invalidating React Query keys:", queryKeys);

    // Invalidate queries to ensure fresh data on next visit
    await Promise.all(
      queryKeys.map(key =>
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    );
  }

  // 3. Clear any other transient states if necessary
  // (Add more store resets here as the app grows)

  console.log("[DEBUG] resetBookingFlow completed");
};
