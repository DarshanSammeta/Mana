import { getEventTypes, getMarketplaceCategories } from "@/lib/marketplace";
import Navbar from "./Navbar";

export default async function NavbarWrapper() {
  // Pre-fetch data for the Navbar on the server
  // This avoids the client-side fetch waterfall on every page load
  const [eventTypes, categories] = await Promise.all([
    getEventTypes(),
    getMarketplaceCategories(),
  ]);

  return <Navbar initialEventTypes={eventTypes} initialCategories={categories} />;
}
