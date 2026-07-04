import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LocationDetails {
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  locality?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  source?: 'GPS' | 'MANUAL' | 'IP';
  accuracy?: number;
}

export interface SavedAddress extends LocationDetails {
  id: string;
  label: string; // Home, Office, Other
  customLabel?: string;
  isDefault: boolean;
  isFavorite: boolean;
  fullName?: string;
  mobileNumber?: string;
  street?: string;
  area?: string;
  landmark?: string;
}

interface LocationState extends LocationDetails {
  isAutoDetected: boolean;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'blocked' | 'unavailable' | 'timeout' | 'unknown';
  savedAddresses: SavedAddress[];
  recentLocations: LocationDetails[];

  // Actions
  setCity: (city: string) => void;
  setAddress: (address: string) => void;
  setLocation: (details: Partial<LocationDetails>) => void;
  setPermissionStatus: (status: LocationState['permissionStatus']) => void;
  setAutoDetected: (isAutoDetected: boolean) => void;

  // Address Management
  addSavedAddress: (address: SavedAddress) => void;
  removeSavedAddress: (id: string) => void;
  updateSavedAddress: (id: string, updates: Partial<SavedAddress>) => void;
  addRecentLocation: (location: LocationDetails) => void;
  clearRecentLocations: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      city: "Hyderabad",
      address: "Hyderabad, Telangana",
      lat: null,
      lng: null,
      locality: "",
      district: "",
      state: "Telangana",
      country: "India",
      postalCode: "",
      source: 'MANUAL',
      isAutoDetected: false,
      permissionStatus: 'unknown',
      savedAddresses: [],
      recentLocations: [],

      setCity: (city) => set({ city }),
      setAddress: (address) => set({ address }),
      setLocation: (details) => set((state) => ({ ...state, ...details })),
      setPermissionStatus: (status) => set({ permissionStatus: status }),
      setAutoDetected: (isAutoDetected) => set({ isAutoDetected }),

      addSavedAddress: (address) => set((state) => ({
        savedAddresses: [address, ...state.savedAddresses.filter(a => a.id !== address.id)]
      })),
      removeSavedAddress: (id) => set((state) => ({
        savedAddresses: state.savedAddresses.filter(a => a.id !== id)
      })),
      updateSavedAddress: (id, updates) => set((state) => ({
        savedAddresses: state.savedAddresses.map(a => a.id === id ? { ...a, ...updates } : a)
      })),
      addRecentLocation: (location) => set((state) => ({
        recentLocations: [
          location,
          ...state.recentLocations.filter(l => l.address !== location.address)
        ].slice(0, 5) // Keep last 5
      })),
      clearRecentLocations: () => set({ recentLocations: [] }),
    }),
    {
      name: 'location-storage',
    }
  )
);
