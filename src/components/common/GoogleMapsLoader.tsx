"use client";

import Script from "next/script";

import { MAPS_CONFIG } from "@/config/maps";

export function GoogleMapsLoader() {
  if (!MAPS_CONFIG.apiKey) {
    console.warn("Google Maps API key is missing. Map features will be disabled.");
    return null;
  }

  const libraries = MAPS_CONFIG.libraries.join(",");
  const src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_CONFIG.apiKey}&libraries=${libraries}&loading=async`;

  return (
    <Script
      src={src}
      strategy="lazyOnload"
    />
  );
}
