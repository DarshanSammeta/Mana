import { APP_CONFIG } from "@/config/app";
import { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";
import { getMarketplaceVendors, getMarketplaceCategories } from "@/lib/marketplace";
import { Suspense } from "react";
import { GridSectionSkeleton } from "@/components/common/Skeletons";
import { prisma } from "@/lib/prisma";
import ErrorBoundary from "@/components/common/ErrorBoundary";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ category?: string; subcategory?: string; query?: string; city?: string; eventName?: string; locality?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const category = params.subcategory || params.category || "Professional Services";
  const city = params.city || "Hyderabad";
  const event = params.eventName ? ` for ${params.eventName}` : "";
  const locality = params.locality ? ` in ${params.locality},` : "";

  // Intelligent SEO Metadata Generation (Phase 19)
  const title = `${category} in ${city}${event} | Verified Vendors - Mana Events`;
  const description = `Find top-rated ${category}${locality} ${city}${event}. Book verified event professionals with transparent pricing and real reviews. Best event services in India.`;

  const baseUrl = APP_CONFIG.url;
  const searchString = new URLSearchParams(params as Record<string, string>).toString();
  const canonical = `${baseUrl}/marketplace${searchString ? `?${searchString}` : ""}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      images: ["/og-marketplace.jpg"],
    },
  };
}

function MarketplaceLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-16 bg-white border-b border-gray-200" />
      <div className="max-w-[1500px] mx-auto w-full px-4 lg:px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="hidden lg:block w-72 h-[600px] bg-gray-50 rounded-2xl animate-pulse" />
          <div className="flex-1">
            <GridSectionSkeleton count={6} />
          </div>
        </div>
      </div>
    </div>
  );
}

async function getEventTypes() {
  return prisma.eventtype.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      image: true,
      description: true,
      icon: true
    }
  });
}

import { POPULAR_CITIES } from "@/data/common/cities";

async function getCities() {
  // In a real app, this might come from a distinct query on vendor profiles or a predefined list
  return POPULAR_CITIES;
}

export default async function MarketplacePage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;

  // Extract filters from searchParams
  const filters = {
    category: (params.subcategory as string) || (params.category as string) || undefined,
    eventTypeId: (params.eventTypeId as string) || undefined,
    city: (params.city as string) || undefined,
    query: (params.query as string) || undefined,
    minPrice: params.minPrice ? parseFloat(params.minPrice as string) : undefined,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice as string) : undefined,
    rating: params.rating ? parseFloat(params.rating as string) : undefined,
    sort: (params.sort as string) || "featured",
    lat: params.lat ? parseFloat(params.lat as string) : undefined,
    lng: params.lng ? parseFloat(params.lng as string) : undefined,
    page: params.page ? parseInt(params.page as string) : 1,
    limit: 12,
  };

  try {
    // Fetch all required data on server
    const [initialVendors, categories, eventTypes, cities] = await Promise.all([
      getMarketplaceVendors(filters).catch(err => {
        console.error("Error fetching vendors:", err);
        return { vendors: [], total: 0, page: 1, limit: 12, totalPages: 0 };
      }),
      getMarketplaceCategories(filters.eventTypeId).catch(err => {
        console.error("Error fetching categories:", err);
        return [];
      }),
      getEventTypes().catch(err => {
        console.error("Error fetching event types:", err);
        return [];
      }),
      getCities().catch(err => {
        console.error("Error fetching cities:", err);
        return ["Hyderabad", "Mumbai", "Bangalore", "Delhi", "Chennai", "Pune"];
      })
    ]);

    return (
      <ErrorBoundary name="Marketplace">
        <Suspense fallback={<MarketplaceLoading />}>
          <MarketplaceClient
            initialVendors={JSON.parse(JSON.stringify(initialVendors?.vendors || []))}
            initialTotal={initialVendors?.total || 0}
            categories={JSON.parse(JSON.stringify(categories || []))}
            eventTypes={JSON.parse(JSON.stringify(eventTypes || []))}
            cities={cities}
          />
        </Suspense>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Critical error in MarketplacePage:", error);
    // Return a fallback UI or re-throw to be caught by error.tsx
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-600">We&apos;re having trouble loading the marketplace. Please try again later.</p>
          <a
            href="/marketplace"
            className="inline-block px-4 py-2 bg-primary text-white rounded-lg"
          >
            Retry
          </a>
        </div>
      </div>
    );
  }
}
