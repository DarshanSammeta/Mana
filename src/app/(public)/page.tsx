import { Metadata } from "next";
import { getPrisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import dynamic from "next/dynamic";

// Components
import HomeClient from "./HomeClient";
import CategoryGrid from "@/components/home/sections/CategoryGrid";
import FeaturedVendors from "@/components/home/sections/FeaturedVendors";
import TrendingDeals from "@/components/home/sections/TrendingDeals";
import CategoryIcons from "@/components/home/sections/CategoryIcons";
import HomeStats from "@/components/home/sections/HomeStats";

// Dynamic Imports for below-the-fold components
const WhyChooseUs = dynamic(() => import("@/components/home/WhyChooseUs"), {
    loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse" />
});

const PopularLocations = dynamic(() => import("@/components/home/PopularLocations"), {
    loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse" />
});

export const metadata: Metadata = {
  title: "Mana Events | Premium Event Booking Marketplace",
  description: "Book verified wedding planners, photographers, caterers and more. Experience seamless event planning with Mana Events.",
  openGraph: {
    title: "Mana Events | Premium Event Booking Marketplace",
    description: "Book verified wedding planners, photographers, caterers and more.",
    images: ["/og-image.jpg"],
  },
};

// Cached Data Fetching Functions
const getEventTypes = unstable_cache(
  async () => {
    try {
      const prisma = getPrisma();
      return await prisma.eventtype.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          image: true,
          icon: true,
          description: true,
          categories: {
            select: {
              id: true,
              name: true,
              image: true,
              icon: true,
            }
          }
        },
        orderBy: { name: "asc" }
      });
    } catch (e) {
      console.error("SSR EventTypes Fetch Error:", e);
      return [];
    }
  },
  ['home-event-types'],
  { revalidate: 3600, tags: ['event-types'] }
);

const getFeaturedVendorsData = unstable_cache(
  async () => {
    try {
      const prisma = getPrisma();
      const vendors = await prisma.vendorprofile.findMany({
        where: {
          verificationStatus: "APPROVED",
          rating: { gte: 4 } // Better utilize index [city, verificationStatus, rating]
        },
        take: 8, // Reduced from 12 for faster initial paint and less data
        orderBy: { rating: "desc" },
        select: {
          id: true,
          businessName: true,
          coverImage: true,
          rating: true,
          reviewCount: true,
          city: true,
          service: {
            take: 1,
            select: {
              basePrice: true
            }
          }
        }
      });

      return vendors.map(vendor => ({
        ...vendor,
        basePrice: vendor.service?.[0]?.basePrice ? Number(vendor.service[0].basePrice) : 0
      }));
    } catch (e) {
      console.error("SSR Featured Vendors Fetch Error:", e);
      return [];
    }
  },
  ['home-featured-vendors'],
  { revalidate: 1800, tags: ['vendors', 'featured'] }
);

const getTrendingVendorsData = unstable_cache(
  async () => {
    try {
      const prisma = getPrisma();
      const vendors = await prisma.vendorprofile.findMany({
        where: {
          verificationStatus: "APPROVED",
          totalBookings: { gte: 1 } // Better utilize index
        },
        take: 8, // Reduced from 12
        orderBy: { totalBookings: "desc" },
        select: {
          id: true,
          businessName: true,
          coverImage: true,
          rating: true,
          reviewCount: true,
          city: true,
          service: {
            take: 1,
            select: {
              basePrice: true
            }
          }
        }
      });

      return vendors.map(vendor => ({
        ...vendor,
        basePrice: vendor.service?.[0]?.basePrice ? Number(vendor.service[0].basePrice) : 0
      }));
    } catch (e) {
      console.error("SSR Trending Vendors Fetch Error:", e);
      return [];
    }
  },
  ['home-trending-vendors'],
  { revalidate: 1800, tags: ['vendors', 'trending'] }
);

// getRecentReviews is omitted for now due to database schema mismatch with 'bookingId' column
// which causes fatal Prisma errors even inside try-catch.

export default async function HomePage() {
  // Parallel fetch on server with unstable_cache
  const [eventTypes, featured, trending] = await Promise.all([
    getEventTypes(),
    getFeaturedVendorsData(),
    getTrendingVendorsData()
  ]);

  // Clean data for Client Component
  const serializableEventTypes = JSON.parse(JSON.stringify(eventTypes || []));
  const serializableFeatured = JSON.parse(JSON.stringify(featured || []));
  const serializableTrending = JSON.parse(JSON.stringify(trending || []));

  return (
    <div className="flex flex-col bg-[#EAEDED]">
      <main className="flex-1 w-full pb-12">
        <HomeClient
          initialEventTypes={serializableEventTypes}
          initialFeatured={serializableFeatured}
          initialTrending={serializableTrending}
        />

        <CategoryGrid eventTypes={serializableEventTypes} />

        <FeaturedVendors vendors={serializableFeatured} />

        <TrendingDeals vendors={serializableTrending} />

        <CategoryIcons eventTypes={serializableEventTypes} />

        <PopularLocations />

        <HomeStats />

        <WhyChooseUs />
      </main>
    </div>
  );
}
