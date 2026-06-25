import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocationState {
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  setCity: (city: string) => void;
  setAddress: (address: string) => void;
  setLocation: (lat: number, lng: number) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      city: "Hyderabad",
      address: "Hyderabad, Telangana",
      lat: null,
      lng: null,
      setCity: (city) => set({ city }),
      setAddress: (address) => set({ address }),
      setLocation: (lat, lng) => set({ lat, lng }),
    }),
    {
      name: 'location-storage',
    }
  )
);
