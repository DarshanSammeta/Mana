import apiClient from "@/lib/apiClient";

export interface Coordinates {
  lat: number;
  lng: number;
}

export const mapsService = {
  geocodeAddress: async (address: string): Promise<Coordinates | null> => {
    // We should route this through our backend to protect API key
    const response = await apiClient.get("/maps/geocode", { params: { address } });
    return response.data;
  },

  reverseGeocode: async (lat: number, lng: number): Promise<any | null> => {
    const response = await apiClient.get("/maps/reverse-geocode", { params: { lat, lng } });
    return response.data;
  },

  calculateDistance: async (origin: Coordinates, destination: Coordinates): Promise<number | null> => {
    const response = await apiClient.get("/maps/distance", {
      params: {
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: destination.lat,
        destLng: destination.lng
      }
    });
    return response.data.distanceKm;
  },

  getAutocomplete: async (input: string) => {
    const response = await apiClient.get("/maps/autocomplete", { params: { input } });
    return response.data;
  }
};
