import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Providers from "./providers";
import PageTransition from "@/components/common/PageTransition";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  themeColor: "#6D28D9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Mana Events | Premium Event Booking Marketplace",
    template: "%s | Mana Events"
  },
  description: "Book verified wedding planners, photographers, caterers and more for your perfect event.",
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
import AuthHydrationFix from "@/components/auth/AuthHydrationFix";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextTopLoader
          color="#6D28D9"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #6D28D9,0 0 5px #6D28D9"
        />
        <Providers>
          <AuthHydrationFix>
            <GlobalLoadingOverlay />
            <RouteLoadingHandler />
            <PageTransition>
              {children}
            </PageTransition>
          </AuthHydrationFix>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
