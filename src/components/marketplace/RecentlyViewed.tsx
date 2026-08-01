"use client";

import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ServiceCard } from "./ServiceCard";

export function RecentlyViewed() {
  const { recentlyViewed } = useRecentlyViewed();

  if (!recentlyViewed || recentlyViewed.length === 0) return null;

  return (
    <div className="mt-20 pt-10 border-t border-slate-200">
      <h2 className="text-xl font-bold text-[#0F1111] mb-6">Recently Viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {recentlyViewed.slice(0, 6).map((item, i) => (
          <div key={item.id} className="scale-90 origin-top">
             <ServiceCard service={item as any} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
