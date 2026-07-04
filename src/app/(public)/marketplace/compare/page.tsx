import { Metadata } from "next";
import CompareClient from "./CompareClient";
import { getEventTypes, getMarketplaceCategories } from "@/lib/marketplace";

export const metadata: Metadata = {
  title: "Compare Vendors | Mana Events",
  description: "Compare your favorite event professionals side-by-side. View pricing, ratings, and features to make the best choice for your event.",
  openGraph: {
    title: "Compare Event Professionals | Mana Events",
    description: "Make an informed decision by comparing top-rated event vendors side-by-side.",
  }
};

export default async function ComparePage() {
  const [eventTypes, categories] = await Promise.all([
    getEventTypes(),
    getMarketplaceCategories()
  ]);

  return <CompareClient initialEventTypes={eventTypes} initialCategories={categories} />;
}
