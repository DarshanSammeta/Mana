"use client";

import Script from "next/script";

import { MAPS_CONFIG } from "@/config/maps";

export function GoogleMapsLoader() {
  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${MAPS_CONFIG.apiKey}&libraries=${MAPS_CONFIG.libraries.join(",")}`}
      strategy="lazyOnload"
    />
  );
}
