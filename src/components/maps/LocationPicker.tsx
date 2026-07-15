'use client';

import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search } from 'lucide-react';
import { MAPS_CONFIG } from '@/config/maps';

interface LocationPickerProps {
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void;
  initialLocation?: { lat: number; lng: number };
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.75rem',
};

const center = {
  lat: 12.9716, // Bangalore default
  lng: 77.5946,
};

export const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialLocation }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: MAPS_CONFIG.apiKey || '',
    libraries: ['places'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral>(initialLocation || center);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPosition(newPos);
      reverseGeocode(newPos);
    }
  };

  const reverseGeocode = (pos: google.maps.LatLngLiteral) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: pos }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const addr = results[0].formatted_address;
        setAddress(addr);
        onLocationSelect({ address: addr, ...pos });
      }
    });
  };

  const handleSearch = () => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const { lat, lng } = results[0].geometry.location;
        const newPos = { lat: lat(), lng: lng() };
        setMarkerPosition(newPos);
        setAddress(results[0].formatted_address);
        map?.panTo(newPos);
        onLocationSelect({ address: results[0].formatted_address, ...newPos });
      }
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const newPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMarkerPosition(newPos);
        map?.panTo(newPos);
        reverseGeocode(newPos);
      });
    }
  };

  if (!MAPS_CONFIG.apiKey) {
    return (
      <div className="h-[400px] w-full bg-muted rounded-xl flex items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium">Google Maps API key is missing.</p>
          <p className="text-xs text-muted-foreground">Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to use the location picker.</p>
        </div>
      </div>
    );
  }

  return isLoaded ? (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a location..."
            className="pl-10"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <Button onClick={handleSearch} variant="secondary">
          Search
        </Button>
        <Button onClick={getCurrentLocation} variant="outline" title="Use Current Location">
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden border shadow-sm">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={markerPosition}
          zoom={15}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
          }}
        >
          <Marker position={markerPosition} />
        </GoogleMap>
      </div>

      {address && (
        <div className="p-3 bg-muted rounded-lg text-sm flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-0.5 text-primary" />
          <span>{address}</span>
        </div>
      )}
    </div>
  ) : (
    <div className="h-[400px] w-full bg-muted animate-pulse rounded-xl" />
  );
};
