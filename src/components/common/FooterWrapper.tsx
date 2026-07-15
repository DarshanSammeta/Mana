"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();

  // Define paths where the Footer should NOT be displayed
  // This includes dashboard areas and authentication pages
  const excludedPaths = [
    "/login",
    "/register",
    "/vendor/dashboard",
    "/vendor/settings",
    "/vendor/bookings",
    "/vendor/services",
    "/vendor/packages",
    "/vendor/portfolio",
    "/vendor/reviews",
    "/vendor/earnings",
    "/vendor/wallet",
    "/vendor/team",
    "/vendor/reports",
    "/vendor/availability",
    "/vendor/subscription",
    "/vendor/notifications",
    "/vendor/onboarding",
    "/customer/dashboard",
    "/customer/bookings",
    "/customer/wishlist",
    "/customer/settings",
    "/customer/orders",
    "/customer/events",
    "/admin",
    "/map", // Map is usually full-screen
  ];

  const shouldHideFooter = excludedPaths.some(path => pathname?.startsWith(path));

  if (shouldHideFooter) {
    return null;
  }

  return <Footer />;
}
