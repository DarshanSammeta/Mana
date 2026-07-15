import { useState, useEffect, useCallback } from "react";

const MAX_RECENT = 10;
const STORAGE_KEY = "mana_recently_viewed";

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentlyViewed(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recently viewed", e);
      }
    }
  }, []);

  const trackView = useCallback((vendor: any) => {
    if (!vendor || !vendor.id) return;

    setRecentlyViewed((prev) => {
      const newRecent = [
        {
          id: vendor.id,
          businessName: vendor.businessName,
          coverImage: vendor.coverImage,
          rating: vendor.rating,
          reviewCount: vendor.reviewCount,
          city: vendor.city,
          basePrice: vendor.basePrice || (vendor.service?.[0]?.basePrice)
        },
        ...prev.filter((v) => v.id !== vendor.id),
      ].slice(0, MAX_RECENT);

      // Only update if something actually changed to avoid unnecessary re-renders
      if (JSON.stringify(newRecent) === JSON.stringify(prev)) return prev;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecent));
      return newRecent;
    });
  }, []);

  return { recentlyViewed, trackView };
}
