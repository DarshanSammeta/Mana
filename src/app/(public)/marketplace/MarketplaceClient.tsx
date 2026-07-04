"use client";

import { useCallback, useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import Link from "next/link";

import { useSearchParams } from "next/navigation";
import { useLocationStore } from "@/store/locationStore";
import { fetchMoreVendors } from "./actions";
import { useInView } from "react-intersection-observer";

import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { EventTypeSidebar } from "@/components/marketplace/EventTypeSidebar";
import { CategoryBar } from "@/components/marketplace/CategoryBar";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { VendorCard } from "@/components/marketplace/VendorCard";
import { CompareFloatingBar } from "@/components/marketplace/CompareFloatingBar";
import { EmptyState } from "@/components/common/EmptyState";

const VendorMapView = dynamic(() => import("@/components/marketplace/VendorMapView").then(mod => mod.VendorMapView), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-slate-100 animate-pulse rounded-3xl" />
});

import { DEFAULT_CITIES } from "@/data/marketplace/filters";

import { PAGINATION } from "@/constants";
import { MAPS_CONFIG } from "@/config/maps";

export default function MarketplaceClient({
  initialVendors,
  initialTotal,
  categories,
  eventTypes,
  cities = DEFAULT_CITIES
}: {
  initialVendors: any[],
  initialTotal: number,
  categories: any[],
  eventTypes: any[],
  cities?: string[]
}) {
  const searchParams = useSearchParams();
  const { lat, lng } = useLocationStore();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");

  const [vendors, setVendors] = useState(initialVendors);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialVendors.length < initialTotal);

  const loadMore = useCallback(async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);
    try {
      const nextPage = reset ? 1 : page + 1;
      const params = searchParams ? Object.fromEntries(searchParams.entries()) : {};
      const result = await fetchMoreVendors({
        ...params,
        lat: lat || undefined,
        lng: lng || undefined,
        page: nextPage,
        limit: PAGINATION.MARKETPLACE_LIMIT
      });

      if (result.vendors && result.vendors.length > 0) {
        setVendors(prev => {
           if (reset) return result.vendors;
           const existingIds = new Set(prev.map(v => v.id));
           const newVendors = result.vendors.filter((v: any) => !existingIds.has(v.id));
           return [...prev, ...newVendors];
        });
        setPage(nextPage);
        setHasMore(result.vendors.length === PAGINATION.MARKETPLACE_LIMIT);
      } else {
        if (reset) setVendors([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more vendors:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, searchParams, lat, lng]);

  // Re-fetch when location becomes available to get proximity ranking
  useEffect(() => {
    if (lat && lng && vendors.length > 0 && !searchParams?.get('lat')) {
      loadMore(true);
    }
  }, [lat, lng, vendors.length, searchParams, loadMore]);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "400px",
  });

  // Reset when initialVendors change (on filter change from server)
  useEffect(() => {
    setVendors(initialVendors);
    setPage(1);
    setHasMore(initialVendors.length < initialTotal);
  }, [initialVendors, initialTotal]);

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMore();
    }
  }, [inView, hasMore, loading, loadMore]);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <CategoryBar categories={categories} />

      <main className="flex-1 w-full max-w-[1500px] mx-auto px-4 lg:px-6 py-12 flex flex-col lg:flex-row gap-12">
        <aside className="hidden lg:block lg:w-72 shrink-0">
          <div className="sticky top-32 space-y-8">
             <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="font-black text-[#111827] uppercase tracking-tighter text-lg">Filters</h3>
                   <Link href="/marketplace">
                    <Button variant="ghost" size="sm" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50">Reset</Button>
                   </Link>
                </div>
                <MarketplaceFilters cities={cities} />
             </div>

             <EventTypeSidebar eventTypes={eventTypes} />
          </div>
        </aside>

        <div className="flex-1">
          <MarketplaceHeader
            totalResults={initialTotal}
            viewMode={viewMode}
            setViewMode={setViewMode}
            cities={cities}
          />

          <AnimatePresence mode="wait">
            {vendors.length > 0 ? (
              viewMode === "map" ? (
                <VendorMapView vendors={vendors} center={{ lat: lat || MAPS_CONFIG.defaultCenter.lat, lng: lng || MAPS_CONFIG.defaultCenter.lng }} />
              ) : (
                <div className="space-y-12">
                  <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 items-stretch" : "space-y-6"}>
                    {vendors.map((vendor: any, i: number) => (
                      <VendorCard
                        key={`${vendor.id}-${i}`}
                        vendor={vendor}
                        index={i}
                        viewMode={viewMode}
                        priority={i < 4}
                      />
                    ))}
                  </div>

                  {hasMore && (
                    <div ref={ref} className="flex justify-center pt-8">
                      <Button
                        onClick={() => loadMore(false)}
                        disabled={loading}
                        variant="outline"
                        className="rounded-full px-12 h-14 font-black uppercase tracking-widest text-[11px] border-2 border-slate-100 hover:bg-slate-50 min-w-[240px]"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading More...
                          </>
                        ) : (
                          "Load More Professionals"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )
            ) : (
              <EmptyState
                icon={Search}
                title="No matching vendors found"
                description={`We couldn't find any results matching your filters. Try adjusting your search terms or clearing filters.`}
                actionText="Clear All Filters"
                onActionClick={() => {
                  window.location.href = '/marketplace';
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <CompareFloatingBar />
    </div>
  );
}
