import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

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
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
      // distance is in meters, return in kilometers
      return response.data.rows[0].elements[0].distance.value / 1000;
    }
    return null;
  } catch (error) {
    console.error('Distance calculation error:', error);
    return null;
  }
};

export const haversineDistance = (coords1: Coordinates, coords2: Coordinates): number => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Radius of the Earth in km

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLng = toRad(coords2.lng - coords1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1.lat)) * Math.cos(toRad(coords2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};
