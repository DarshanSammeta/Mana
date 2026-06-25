import { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Mana Events | Premium Event Booking Marketplace",
  description: "Book verified wedding planners, photographers, caterers and more. Experience seamless event planning with Mana Events.",
  openGraph: {
    title: "Mana Events | Premium Event Booking Marketplace",
    description: "Book verified wedding planners, photographers, caterers and more.",
    images: ["/og-image.jpg"],
  },
};

export default function HomePage() {
  return <HomeClient />;
}
