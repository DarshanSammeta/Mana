"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import Link from "next/link";

import { useSearchParams } from "next/navigation";
import { useLocationStore } from "@/store/locationStore";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { marketplaceService } from "@/services/client";

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
  const lat = useLocationStore(state => state.lat);
  const lng = useLocationStore(state => state.lng);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [isFirstMount, setIsFirstMount] = useState(true);

  useEffect(() => {
    setIsFirstMount(false);
  }, []);

  // Extract current filters from URL
  const eventTypeId = searchParams?.get("eventTypeId") || undefined;
  const category = searchParams?.get("category") || searchParams?.get("subcategory") || undefined;
  const query = searchParams?.get("query") || undefined;
  const sort = searchParams?.get("sort") || "featured";
  const city = searchParams?.get("city") || undefined;
  const minPrice = searchParams?.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
  const maxPrice = searchParams?.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
  const rating = searchParams?.get("rating") ? parseFloat(searchParams.get("rating")!) : undefined;
  const currentPage = searchParams?.get("page") ? parseInt(searchParams.get("page")!) : 1;

  // Single Source of Truth for Active Event Type (Step 3 & 9)
  const activeEventType = useMemo(() =>
    eventTypes.find(t => t.id === eventTypeId),
  [eventTypes, eventTypeId]);

  // Unified Category Management (Step 4 & 6)
  const { data: effectiveCategories = [] } = useQuery({
    queryKey: ["categories", eventTypeId],
    queryFn: () => marketplaceService.getCategories(eventTypeId),
    initialData: isFirstMount ? categories : [],
    staleTime: 1000 * 60 * 30,
    select: (data) => Array.isArray(data) ? data : [],
  });

  // Optimized Infinite Loading with React Query (Step 4 & 7)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['marketplace', 'vendors', { eventTypeId, category, query, sort, city, minPrice, maxPrice, rating, lat, lng }],
    queryFn: ({ pageParam = 1 }) => marketplaceService.searchVendors({
      eventTypeId,
      category,
      query,
      sort,
      city,
      minPrice,
      maxPrice,
      rating,
      lat: lat || undefined,
      lng: lng || undefined,
      page: pageParam as number,
      limit: PAGINATION.MARKETPLACE_LIMIT
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      const pagination = lastPage.pagination;
      if (pagination && pagination.page < pagination.totalPages) {
        return pagination.page + 1;
      }
      return undefined;
    },
    // Trust server data on first mount regardless of filters (since server uses same filters)
    initialData: (isFirstMount && currentPage === 1) ? {
      pages: [{
        vendors: initialVendors,
        pagination: {
          page: 1,
          totalPages: Math.ceil(initialTotal / PAGINATION.MARKETPLACE_LIMIT),
          total: initialTotal
        }
      }],
      pageParams: [1]
    } : undefined,
    staleTime: 1000 * 60 * 5,
  });

  // Step 15: Development Logs (Identical Verification)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("--- Marketplace Sync Audit ---");
      console.log("URL EventType ID:", eventTypeId);
      console.log("Active EventType Name:", activeEventType?.name);
      console.log("Query Key EventType ID:", eventTypeId);
      console.log("Category List Count:", effectiveCategories?.length);
      console.log("------------------------------");
    }
  }, [eventTypeId, activeEventType, effectiveCategories]);

  const vendors = useMemo(() => data?.pages.flatMap(page => page.vendors) || [], [data]);
  const totalResults = data?.pages[0]?.pagination?.total || initialTotal;

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "400px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <CategoryBar categories={effectiveCategories} />

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
            totalResults={totalResults}
            viewMode={viewMode}
            setViewMode={setViewMode}
            cities={cities}
            activeEventType={activeEventType}
          />

          {isLoading && vendors.length === 0 ? (
             <div className="flex items-center justify-center py-24">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
          ) : (
            <AnimatePresence mode="wait">
              {vendors.length > 0 ? (
                viewMode === "map" ? (
                  <VendorMapView vendors={vendors} center={{ lat: lat || MAPS_CONFIG.defaultCenter.lat, lng: lng || MAPS_CONFIG.defaultCenter.lng }} />
                ) : (
                  <div className="space-y-12">
                    <motion.div
                      layout
                      className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 items-stretch" : "space-y-6"}
                    >
                      {vendors.map((vendor: any, i: number) => (
                        <VendorCard
                          key={`${vendor.id}-${i}`}
                          vendor={vendor}
                          index={i}
                          viewMode={viewMode}
                          priority={i < 4}
                        />
                      ))}
                    </motion.div>

                    {hasNextPage && (
                      <div ref={ref} className="flex justify-center pt-8">
                        <Button
                          onClick={() => fetchNextPage()}
                          disabled={isFetchingNextPage}
                          variant="outline"
                          className="rounded-full px-12 h-14 font-black uppercase tracking-widest text-[11px] border-2 border-slate-100 hover:bg-slate-50 min-w-[240px]"
                        >
                          {isFetchingNextPage ? (
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
          )}
        </div>
      </main>

      <CompareFloatingBar />
    </div>
  );
}
