export const MAPS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY,
  libraries: ["places"] as any[],
  defaultCenter: { lat: 17.3850, lng: 78.4867 }, // Hyderabad
};
