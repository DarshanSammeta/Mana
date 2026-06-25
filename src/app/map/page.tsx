'use client';

import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Star, MapPin, Phone, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const mapContainerStyle = {
  width: '100%',
  height: 'calc(100vh - 64px)',
};

const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946,
};

export default function GlobalMapPage() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [center, setCenter] = useState(defaultCenter);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  const { data: vendors } = useQuery({
    queryKey: ['map-vendors', center],
    queryFn: async () => {
      const res = await axios.get(`/api/vendors/nearby?lat=${center.lat}&lng=${center.lng}&radius=50`);
      return res.data;
    },
    enabled: isLoaded,
  });

  if (!isLoaded) return <div className="h-screen w-full bg-muted animate-pulse" />;

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        {vendors?.map((vendor: any) => (
          <Marker
            key={vendor.id}
            position={{ lat: vendor.latitude, lng: vendor.longitude }}
            onClick={() => setSelectedVendor(vendor)}
            icon={{
              url: '/map-marker-vendor.png', // custom icon path
              scaledSize: new google.maps.Size(40, 40),
            }}
          />
        ))}

        {selectedVendor && (
          <InfoWindow
            position={{ lat: selectedVendor.latitude, lng: selectedVendor.longitude }}
            onCloseClick={() => setSelectedVendor(null)}
          >
            <div className="p-2 max-w-[200px]">
              <h3 className="font-bold text-sm">{selectedVendor.businessName}</h3>
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{selectedVendor.rating.toFixed(1)}</span>
                <span className="text-[10px] text-muted-foreground ml-1">
                  ({selectedVendor.distance.toFixed(1)} km)
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2">
                {selectedVendor.description}
              </p>
              <Link
                href={`/vendors/${selectedVendor.id}`}
                className="mt-3 flex items-center justify-between text-[10px] font-bold text-primary hover:underline"
              >
                VIEW PROFILE <ExternalLink className="h-2 w-2" />
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Floating UI Elements */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border">
          <h2 className="font-bold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Vendors Near You
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Showing {vendors?.length || 0} active vendors in your area.
          </p>
        </div>
      </div>
    </div>
  );
}

const mapStyles = [
  {
    "featureType": "poi",
    "elementType": "labels",
    "stylers": [{ "visibility": "off" }]
  }
];
