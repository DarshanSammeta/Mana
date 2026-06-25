import { Metadata } from "next";
import MarketplaceClient from "./MarketplaceClient";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ category?: string; subcategory?: string; query?: string; city?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const category = params.subcategory || params.category || "All Categories";
  const city = params.city ? ` in ${params.city}` : "";
  const query = params.query ? ` matching "${params.query}"` : "";

  const title = `Find ${category}${city}${query} | Mana Events Marketplace`;
  const description = `Discover top-rated ${category} professionals${city}. Browse portfolios, check reviews, and book verified vendors for your next event.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ["/og-marketplace.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-marketplace.jpg"],
    },
  };
}

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
