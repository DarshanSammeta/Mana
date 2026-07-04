"use client";

import { useEffect, useCallback } from 'react';
import { useLocationStore, LocationDetails } from '@/store/locationStore';
import { mapsService } from '@/services/maps.service';
import { useToast } from '@/hooks/use-toast';

export function useLocation() {
  const {
    lat, lng, city, locality, setLocation,
    setPermissionStatus, setAutoDetected, permissionStatus
  } = useLocationStore();
  const { toast } = useToast();

  const updateLocationDetails = useCallback(async (latitude: number, longitude: number) => {
    try {
      const data = await mapsService.reverseGeocode(latitude, longitude);
      if (data && data.address) {
        const addr = data.address;
        const details: Partial<LocationDetails> = {
          lat: latitude,
          lng: longitude,
          city: addr.city || addr.town || addr.village || addr.state_district || "Unknown City",
          locality: addr.suburb || addr.neighbourhood || addr.residential || addr.locality || "",
          district: addr.state_district || addr.city_district || "",
          state: addr.state || "",
          country: addr.country || "India",
          postalCode: addr.postcode || "",
          address: data.display_name || "",
        };
        setLocation(details);
        setAutoDetected(true);
        return details;
      }
    } catch (error) {
      console.error("Failed to reverse geocode:", error);
    }
    return null;
  }, [setLocation, setAutoDetected]);

  const detectLocation = useCallback((showToast = false) => {
    return new Promise<void>((resolve, reject) => {
      if (!navigator.geolocation) {
        setPermissionStatus('unavailable');
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setPermissionStatus('granted');
          const { latitude, longitude, accuracy } = position.coords;
          const details = await updateLocationDetails(latitude, longitude);
          if (details) {
            setLocation({ ...details, accuracy, source: 'GPS' });
            if (showToast) {
              toast({
                title: "Location Updated",
                description: `Now showing vendors near ${details.locality || details.city}`,
              });
            }
          }
          resolve();
        },
        (error) => {
          let status: 'denied' | 'blocked' | 'unavailable' | 'timeout' | 'unknown' = 'unknown';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              status = 'denied';
              break;
            case error.POSITION_UNAVAILABLE:
              status = 'unavailable';
              break;
            case error.TIMEOUT:
              status = 'timeout';
              break;
          }
          setPermissionStatus(status);
          console.error("Geolocation error:", {
            code: error.code,
            message: error.message,
            status
          });
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, [setPermissionStatus, updateLocationDetails, setLocation, toast]);

  // Initial detection if status is unknown
  useEffect(() => {
    if (permissionStatus === 'unknown' || (permissionStatus === 'prompt' && !lat)) {
      // We don't want to annoy users immediately, maybe check if we have a saved location
      if (!lat) {
        // Try to infer from IP or default if needed, but for now just wait for user interaction or auto-detect if allowed
      }
    }
  }, [permissionStatus, lat]);

  // Automatic re-sync logic for when a user regains internet connectivity
  useEffect(() => {
    const handleOnline = () => {
      console.log("Internet connection regained. Re-validating location...");
      if (!lat || !lng) {
        detectLocation(false);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [lat, lng, detectLocation]);

  return {
    detectLocation,
    lat,
    lng,
    city,
    locality,
    permissionStatus
  };
}
