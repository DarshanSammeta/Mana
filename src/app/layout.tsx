import type { Metadata } from "next";
import { inter } from "@/config/fonts";
import { APP_CONFIG } from "@/config/app";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "./providers";
import PageTransition from "@/components/common/PageTransition";
import { Suspense } from "react";


export const viewport = {
  themeColor: "#6D28D9",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.url),
  title: {
    default: `${APP_CONFIG.name} | Premium Event Booking Marketplace`,
    template: `%s | ${APP_CONFIG.name}`
  },
  description: APP_CONFIG.description,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mana Events",
  },
  openGraph: {
    type: "website",
    siteName: "Mana Events",
    title: "Mana Events | Premium Event Booking Marketplace",
    description: "Book verified wedding planners, photographers, caterers and more.",
    images: [
      {
        url: "/og-image.jpg",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mana Events | Premium Event Booking Marketplace",
    description: "Book verified wedding planners, photographers, caterers and more.",
    images: ["/og-image.jpg"],
  },
};

import NextTopLoader from 'nextjs-toploader';
import GlobalLoadingOverlay from "@/components/common/GlobalLoadingOverlay";
import RouteLoadingHandler from "@/components/common/RouteLoadingHandler";
import { GoogleMapsLoader } from "@/components/common/GoogleMapsLoader";
import NavbarWrapper from "@/components/common/NavbarWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <NextTopLoader
          color="#6D28D9"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          showSpinner={false}
          easing="ease"
          speed={200}
        />
        <Providers>
          <div className="flex flex-col min-h-screen">
            <NavbarWrapper />
            <GlobalLoadingOverlay />
            <Suspense fallback={null}>
              <RouteLoadingHandler />
            </Suspense>
            <GoogleMapsLoader />
            <main className="flex-1">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
            {/* Note: Footer is often page-specific in its design,
                but for performance we can keep it here or in a sub-layout */}
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
