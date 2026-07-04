import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CompareVendor {
  id: string;
  businessName: string;
  coverImage?: string;
  rating: number;
  basePrice: number;
  city: string;
  category?: string;
}

interface CompareState {
  vendors: CompareVendor[];
  addVendor: (vendor: CompareVendor) => void;
  removeVendor: (vendorId: string) => void;
  clearCompare: () => void;
  isInCompare: (vendorId: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      vendors: [],
      addVendor: (vendor) => {
        const { vendors } = get();
        if (vendors.length >= 4) {
          // Limit to 4 vendors for comparison
          alert("You can compare up to 4 vendors at a time.");
          return;
        }
        if (!vendors.find((v) => v.id === vendor.id)) {
          set({ vendors: [...vendors, vendor] });
        }
      },
      removeVendor: (vendorId) => {
        set({ vendors: get().vendors.filter((v) => v.id !== vendorId) });
      },
      clearCompare: () => set({ vendors: [] }),
      isInCompare: (vendorId) => {
        return get().vendors.some((v) => v.id === vendorId);
      },
    }),
    {
      name: 'compare-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
