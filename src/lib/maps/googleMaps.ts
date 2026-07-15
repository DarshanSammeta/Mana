import axios from 'axios';

import { MAPS_CONFIG } from '@/config/maps';

const GOOGLE_MAPS_API_KEY = MAPS_CONFIG.apiKey;

export interface Coordinates {
  lat: number;
  lng: number;
}

export const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === 'OK') {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export const calculateDistance = async (origin: Coordinates, destination: Coordinates): Promise<number | null> => {
  const result = await calculateDetailedDistance(origin, destination);
  return result?.distanceKm || null;
};

export const calculateDetailedDistance = async (origin: Coordinates, destination: Coordinates): Promise<{ distanceKm: number, durationSec: number, trafficDelaySec: number } | null> => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
      const element = response.data.rows[0].elements[0];
      const distanceKm = element.distance.value / 1000;
      const durationSec = element.duration.value;
      const durationInTrafficSec = element.duration_in_traffic?.value || durationSec;
      const trafficDelaySec = Math.max(0, durationInTrafficSec - durationSec);

      return {
        distanceKm,
        durationSec: durationInTrafficSec,
        trafficDelaySec
      };
    }
    return null;
  } catch (error) {
    console.error('Distance calculation error:', error);
    return null;
  }
};

export const reverseGeocode = async (lat: number, lng: number): Promise<any | null> => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === 'OK') {
      const result = response.data.results[0];
      const components = result.address_components;

      const getComponent = (type: string) =>
        components.find((c: any) => c.types.includes(type))?.long_name;

      return {
        display_name: result.formatted_address,
        address: {
          city: getComponent('locality') || getComponent('administrative_area_level_2'),
          locality: getComponent('sublocality') || getComponent('neighborhood'),
          state: getComponent('administrative_area_level_1'),
          country: getComponent('country'),
          postcode: getComponent('postal_code'),
          state_district: getComponent('administrative_area_level_2')
        }
      };
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

export const getAutocompleteSuggestions = async (input: string): Promise<any[]> => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`
    );

    if (response.data.status === 'OK') {
      return response.data.predictions;
    }
    return [];
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
};

/**
 * Calculates the great-circle distance between two points (haversine formula)
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
