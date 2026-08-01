"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

import { useSearchParams, useRouter } from "next/navigation";
import { useLocationStore } from "@/store/locationStore";
import { useInfiniteQuery } from "@tanstack/react-query";

import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { ServiceGrid } from "@/components/marketplace/ServiceGrid";
import { CompareFloatingBar } from "@/components/marketplace/CompareFloatingBar";
import { EmptyState } from "@/components/common/EmptyState";
import { useQueryClient } from "@tanstack/react-query";
import { resetBookingFlow } from "@/lib/booking-flow";

const VendorMapView = dynamic(
  () =>
    import("@/components/marketplace/VendorMapView").then(
      (mod) => mod.VendorMapView,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full bg-slate-100 animate-pulse rounded-3xl" />
    ),
  },
);

import { DEFAULT_CITIES } from "@/data/marketplace/filters";

import { PAGINATION } from "@/constants";
import { MAPS_CONFIG } from "@/config/maps";

export default function MarketplaceClient({
  initialServices = [],
  initialTotal = 0,
  cities = DEFAULT_CITIES,
  eventTypes: _eventTypes = [],
}: {
  initialServices?: any[];
  initialTotal?: number;
  cities?: string[];
  eventTypes?: any[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const lat = useLocationStore((state) => state.lat);
  const lng = useLocationStore((state) => state.lng);

  const handleResetFilters = useCallback(async () => {
    await resetBookingFlow(queryClient);
    router.push("/marketplace");
  }, [queryClient, router]);

  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [isFirstMount, setIsFirstMount] = useState(true);

  useEffect(() => {
    setIsFirstMount(false);
  }, []);

  // Extract current filters from URL
  const eventTypeId = searchParams?.get("eventTypeId") || undefined;
  const eventType = searchParams?.get("eventType") || undefined;
  const category = searchParams?.get("category") || undefined;
  const query = searchParams?.get("query") || undefined;
  const sort = searchParams?.get("sort") || "featured";
  const city = searchParams?.get("city") || undefined;
  const minPrice = searchParams?.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
  const maxPrice = searchParams?.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
  const rating = searchParams?.get("rating") ? parseFloat(searchParams.get("rating")!) : undefined;
  const currentPage = searchParams?.get("page") ? parseInt(searchParams.get("page")!) : 1;

  // Optimized Infinite Loading for Services
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: [
        "marketplace",
        "services",
        {
          eventTypeId,
          eventType,
          category,
          query,
          sort,
          city,
          minPrice,
          maxPrice,
          rating,
        },
      ],
      queryFn: async ({ pageParam = 1 }) => {
        const res = await fetch(`/api/marketplace/services?${new URLSearchParams({
          ...(eventTypeId && { eventTypeId }),
          ...(eventType && { eventType }),
          ...(category && { category }),
          ...(query && { query }),
          ...(sort && { sort }),
          ...(city && { city }),
          ...(minPrice && { minPrice: minPrice.toString() }),
          ...(maxPrice && { maxPrice: maxPrice.toString() }),
          ...(rating && { rating: rating.toString() }),
          page: pageParam.toString(),
          limit: PAGINATION.MARKETPLACE_LIMIT.toString(),
        })}`);

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Failed to fetch services");
        }

        return res.json();
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage: any) => {
        const pagination = lastPage?.pagination;
        if (pagination && pagination.page < pagination.totalPages) {
          return pagination.page + 1;
        }
        return undefined;
      },
      initialData:
        isFirstMount && currentPage === 1 && initialServices.length > 0
          ? {
              pages: [
                {
                  services: initialServices,
                  pagination: {
                    page: 1,
                    totalPages: Math.ceil(initialTotal / PAGINATION.MARKETPLACE_LIMIT),
                    total: initialTotal,
                  },
                },
              ],
              pageParams: [1],
            }
          : undefined,
      staleTime: 1000 * 60 * 5,
    });

  const services = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.reduce((acc: any[], page: any) => {
      if (page && Array.isArray(page.services)) {
        // Strict filter: element must be an object with an 'id' and a 'vendor' property
        const validServices = page.services.filter((s: any) =>
          s && typeof s === 'object' && s.id && s.vendor && s.vendor.id
        );
        return [...acc, ...validServices];
      }
      return acc;
    }, []);
  }, [data]);

  // Extract unique vendors for map view
  const vendors = useMemo(() => {
    const uniqueVendors = new Map();
    services.forEach(s => {
      if (s.vendor && !uniqueVendors.has(s.vendor.id)) {
        uniqueVendors.set(s.vendor.id, {
          ...s.vendor,
          // Add default location if missing for map clustering
          latitude: s.vendor.latitude || MAPS_CONFIG.defaultCenter.lat,
          longitude: s.vendor.longitude || MAPS_CONFIG.defaultCenter.lng,
        });
      }
    });
    return Array.from(uniqueVendors.values());
  }, [services]);

  const totalResults = data?.pages[0]?.pagination?.total || initialTotal;

  return (
    <div className="min-h-screen bg-[#F1F2F4] flex flex-col font-sans">
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 lg:px-6 py-8 flex flex-col lg:flex-row gap-6">
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-sm text-[#0F1111] uppercase tracking-tight">
                  Filters
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-[10px] font-bold text-blue-600 uppercase hover:underline p-0 h-auto"
                >
                  Clear all
                </Button>
              </div>
              <MarketplaceFilters cities={cities} />
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <MarketplaceHeader
            totalResults={totalResults}
            viewMode={viewMode}
            setViewMode={setViewMode}
            cities={cities}
          />

          {isLoading && services.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-lg border border-slate-200 shadow-sm">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
              <p className="text-sm font-bold text-slate-500">Searching the marketplace...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {services.length > 0 ? (
                viewMode === "map" ? (
                  <VendorMapView
                    vendors={vendors}
                    center={{
                      lat: lat || MAPS_CONFIG.defaultCenter.lat,
                      lng: lng || MAPS_CONFIG.defaultCenter.lng,
                    }}
                  />
                ) : (
                  <ServiceGrid
                    services={services}
                    isLoading={isLoading}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    fetchNextPage={fetchNextPage}
                    viewMode={viewMode === "list" ? "list" : "grid"}
                  />
                )
              ) : (
                <EmptyState
                  icon={Search}
                  title="No results found"
                  description="Try adjusting your filters or search terms to find what you're looking for."
                  actionText="Reset All Filters"
                  onActionClick={handleResetFilters}
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
