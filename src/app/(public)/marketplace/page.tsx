import { APP_CONFIG } from "@/config/app";
import { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";
import { getMarketplaceServices } from "@/lib/marketplace";
import { Suspense } from "react";
import { ServiceGridSkeleton } from "@/components/marketplace/ServiceSkeleton";
import { getPrisma } from "@/lib/prisma";
import ErrorBoundary from "@/components/common/ErrorBoundary";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ category?: string; subcategory?: string; query?: string; city?: string; eventName?: string; locality?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const category = params.subcategory || params.category || "Event Services";
  const city = params.city || "India";
  const query = params.query ? ` matching "${params.query}"` : "";

  const title = `Search ${category}${query} in ${city} | Amazon-style Marketplace - Mana Events`;
  const description = `Discover and book top-rated ${category} with transparent pricing, real reviews, and verified vendors on Mana Events. Best prices guaranteed.`;

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
    <div className="min-h-screen bg-[#F1F2F4] flex flex-col">
      <div className="max-w-[1600px] mx-auto w-full px-4 lg:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden lg:block w-64 h-[800px] bg-white rounded-lg border border-slate-200 animate-pulse" />
          <div className="flex-1">
            <ServiceGridSkeleton count={8} />
          </div>
        </div>
      </div>
    </div>
  );
}

async function getEventTypes() {
  const prisma = getPrisma();
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
  return POPULAR_CITIES;
}

export default async function MarketplacePage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;

  const filters = {
    category: (params.subcategory as string) || (params.category as string) || undefined,
    eventTypeId: (params.eventTypeId as string) || undefined,
    city: (params.city as string) || undefined,
    query: (params.query as string) || undefined,
    minPrice: params.minPrice ? parseFloat(params.minPrice as string) : undefined,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice as string) : undefined,
    rating: params.rating ? parseFloat(params.rating as string) : undefined,
    sort: (params.sort as string) || "featured",
    page: params.page ? parseInt(params.page as string) : 1,
    limit: 12,
  };

  try {
    const [initialData, eventTypes, cities] = await Promise.all([
      getMarketplaceServices(filters).catch(err => {
        console.error("Error fetching services:", err);
        return { services: [], total: 0, page: 1, limit: 12, totalPages: 0 };
      }),
      getEventTypes().catch(err => {
        console.error("Error fetching event types:", err);
        return [];
      }),
      getCities().catch(err => {
        console.error("Error fetching cities:", err);
        return ["Hyderabad", "Mumbai", "Bangalore"];
      })
    ]);

    return (
      <ErrorBoundary name="Marketplace">
        <Suspense fallback={<MarketplaceLoading />}>
          <MarketplaceClient
            initialServices={JSON.parse(JSON.stringify(initialData?.services || []))}
            initialTotal={initialData?.total || 0}
            eventTypes={JSON.parse(JSON.stringify(eventTypes || []))}
            cities={cities}
          />
        </Suspense>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Critical error in MarketplacePage:", error);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-600">We&apos;re having trouble loading the marketplace.</p>
          <a href="/marketplace" className="inline-block px-4 py-2 bg-primary text-white rounded-lg">Retry</a>
        </div>
      </div>
    );
  }
}

