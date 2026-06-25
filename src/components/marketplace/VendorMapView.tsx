"use client";

import React, { useState, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Star, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const mapContainerStyle = {
  width: '100%',
  height: '600px',
  borderRadius: '1rem',
};

const mapStyles = [
  {
    "featureType": "poi",
    "elementType": "labels",
    "stylers": [{ "visibility": "off" }]
  }
];

interface VendorMapViewProps {
  vendors: any[];
  center: { lat: number; lng: number };
}

export function VendorMapView({ vendors, center }: VendorMapViewProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  const validVendors = useMemo(() => {
    return vendors.filter(v => v.latitude && v.longitude);
  }, [vendors]);

  if (!isLoaded) return <div className="h-[600px] w-full bg-gray-100 animate-pulse rounded-xl" />;

  return (
    <div className="relative border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        options={{
          styles: mapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {validVendors.map((vendor) => (
          <Marker
            key={vendor.id}
            position={{ lat: Number(vendor.latitude), lng: Number(vendor.longitude) }}
            onClick={() => setSelectedVendor(vendor)}
          />
        ))}

        {selectedVendor && (
          <InfoWindow
            position={{ lat: Number(selectedVendor.latitude), lng: Number(selectedVendor.longitude) }}
            onCloseClick={() => setSelectedVendor(null)}
          >
            <div className="p-1 max-w-[240px] font-sans">
              <div className="relative h-24 mb-2 rounded-md overflow-hidden">
                <img
                  src={selectedVendor.coverImage || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800"}
                  className="w-full h-full object-cover"
                  alt={selectedVendor.businessName}
                />
                {selectedVendor.verificationStatus === "APPROVED" && (
                    <div className="absolute top-1 right-1">
                        <ShieldCheck className="h-4 w-4 text-white fill-purple-600" />
                    </div>
                )}
              </div>
              <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{selectedVendor.businessName}</h3>
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold">{selectedVendor.rating}</span>
                <span className="text-[10px] text-gray-500 ml-1">
                  ({selectedVendor.reviewCount})
                </span>
                <span className="text-[10px] text-gray-400 ml-auto font-medium">
                  {selectedVendor.distance?.toFixed(1)} km away
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Starting From</p>
                    <p className="text-sm font-bold text-purple-700">₹{selectedVendor.basePrice}</p>
                </div>
                <Link href={`/marketplace/vendor/${selectedVendor.id}`}>
                    <Button size="sm" className="h-7 text-[10px] bg-purple-700 hover:bg-purple-800">
                        Details
                    </Button>
                </Link>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-lg shadow-lg border border-gray-200 pointer-events-auto">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Map View</p>
              <p className="text-xs font-medium text-gray-900">{validVendors.length} vendors visible</p>
          </div>
      </div>
    </div>
  );
}
