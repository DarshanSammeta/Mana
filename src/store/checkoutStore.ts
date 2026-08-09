import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { BUSINESS_CONFIG } from "@/constants/config";
import apiClient from "@/lib/apiClient";

export type CheckoutStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface CheckoutItem {
  vendorId: string;
  vendorName: string;
  serviceId: string;
  packageId: string;
  packageName: string;
  basePrice: number;
  selectedAddonIds: string[];
}

interface SelectionState {
  eventTypeId: string | null;
  eventTypeName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  serviceTypeId: string | null;
  serviceTypeName: string | null;
  packageId: string | null;
  packageName: string | null;
  selectedAddonIds: string[];
  selectedAddonNames: string[];
  selectedAddons: any[];
  vendorId: string | null;
  vendorName: string | null;
  idempotencyKey: string | null;
}

interface GuestBreakdown {
  adults: number;
  kids: number;
  seniors: number;
  veg: number;
  nonVeg: number;
}

interface VenueFeatures {
  isIndoor: boolean;
  isOutdoor: boolean;
  hasParking: boolean;
  hasLift: boolean;
  hasKitchen: boolean;
}

interface EventDetails {
  date: string | null;
  time: string | null;
  guestCount: number;
  guestBreakdown: GuestBreakdown;
  venue: string | null;
  venueFeatures: VenueFeatures;
  address: string | null;
  landmark: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  coordinates?: { lat: number; lng: number };
  instructions: string | null;
}

interface PricingState {
  subtotal: number;
  taxes: number;
  platformFee: number;
  total: number;
  advanceAmount: number;
  balanceAmount: number;
  totalPackageAmount?: number;
  totalAddonAmount?: number;
  totalVendorDiscount?: number;
  totalPlatformDiscount?: number;
  totalCouponDiscount?: number;
  totalGst?: number;
  totalPlatformFee?: number;
  breakdown?: any;
}

interface CheckoutState {
  isStarted: boolean;
  step: CheckoutStep;
  selection: SelectionState;
  items: CheckoutItem[];
  eventDetails: EventDetails;
  pricing: PricingState;
  paymentMethod: string | null;
  isPricingLoading: boolean;
  isAgreed: boolean;

  // Metadata for Event Summary
  serviceImage: string | null;
  serviceName: string | null;
  vendorName: string | null;
  status: 'DRAFT' | 'IN_PROGRESS' | 'READY_FOR_PAYMENT' | 'CONFIRMED';

  // Actions
  setIsStarted: (isStarted: boolean) => void;
  setStep: (step: CheckoutStep) => void;
  setIsAgreed: (agreed: boolean) => void;
  setStatus: (status: 'DRAFT' | 'IN_PROGRESS' | 'READY_FOR_PAYMENT' | 'CONFIRMED') => void;
  setCheckoutItems: (items: CheckoutItem[]) => void;
  setEventType: (id: string | null, name: string | null) => void;
  setCategory: (id: string | null, name: string | null) => void;
  setSubCategory: (id: string | null, name: string | null) => void;
  setServiceType: (id: string | null, name: string | null) => void;
  setPackage: (id: string | null, name: string | null) => void;
  toggleAddon: (id: string) => void;
  setVendor: (id: string | null, name: string | null) => void;
  setVendorInfo: (info: any) => void;
  setEventDetails: (details: Partial<EventDetails>) => void;
  setGuestBreakdown: (breakdown: Partial<GuestBreakdown>) => void;
  setVenueFeatures: (features: Partial<VenueFeatures>) => void;
  setLocation: (location: Partial<EventDetails>) => void;
  setPricing: (pricing: Partial<PricingState>) => void;
  setPaymentMethod: (method: string | null) => void;
  fetchServerPricing: () => Promise<void>;
  calculatePricing: (packagePrice: number, guestRules?: any[]) => void;
  resetCheckout: () => void;
}

const initialSelection: SelectionState = {
  eventTypeId: null,
  eventTypeName: null,
  categoryId: null,
  categoryName: null,
  subcategoryId: null,
  subcategoryName: null,
  serviceTypeId: null,
  serviceTypeName: null,
  packageId: null,
  packageName: null,
  selectedAddonIds: [],
  selectedAddonNames: [],
  selectedAddons: [],
  vendorId: null,
  vendorName: null,
  idempotencyKey: null,
};

const initialGuestBreakdown: GuestBreakdown = {
  adults: 100,
  kids: 0,
  seniors: 0,
  veg: 50,
  nonVeg: 50,
};

const initialVenueFeatures: VenueFeatures = {
  isIndoor: true,
  isOutdoor: false,
  hasParking: false,
  hasLift: false,
  hasKitchen: false,
};

const initialEventDetails: EventDetails = {
  date: null,
  time: "12:00",
  guestCount: 100,
  guestBreakdown: initialGuestBreakdown,
  venue: null,
  venueFeatures: initialVenueFeatures,
  address: null,
  landmark: null,
  city: null,
  state: null,
  pincode: null,
  instructions: null,
};

const initialPricing: PricingState = {
  subtotal: 0,
  taxes: 0,
  platformFee: 0,
  total: 0,
  advanceAmount: 0,
  balanceAmount: 0,
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      isStarted: false,
      step: 1,
      selection: initialSelection,
      items: [],
      eventDetails: initialEventDetails,
      pricing: initialPricing,
      paymentMethod: null,
      isPricingLoading: false,
      isAgreed: false,

      serviceImage: null,
      serviceName: null,
      vendorName: null,
      status: 'DRAFT',

      setIsStarted: (isStarted) => set({ isStarted }),

      setStep: (step) => set({ step }),

      setIsAgreed: (isAgreed) => set({ isAgreed }),

      setStatus: (status) => set({ status }),

      setCheckoutItems: (items) => set({ items }),

      setEventType: (id, name) => set(() => ({
        selection: { ...initialSelection, eventTypeId: id, eventTypeName: name },
        pricing: initialPricing,
      })),

      setCategory: (id, name) => set((state) => ({
        selection: {
          ...state.selection,
          categoryId: id,
          categoryName: name,
          subcategoryId: null,
          subcategoryName: null,
          serviceTypeId: null,
          serviceTypeName: null,
          packageId: null,
          packageName: null,
        },
        pricing: initialPricing,
      })),

      setSubCategory: (id, name) => set((state) => ({
        selection: {
          ...state.selection,
          subcategoryId: id,
          subcategoryName: name,
          serviceTypeId: null,
          serviceTypeName: null,
          packageId: null,
          packageName: null,
        },
        pricing: initialPricing,
      })),

      setServiceType: (id, name) => set((state) => ({
        selection: {
          ...state.selection,
          serviceTypeId: id,
          serviceTypeName: name,
          packageId: null,
          packageName: null,
        },
        pricing: initialPricing,
      })),

      setPackage: (id, name) => {
        set((state) => ({
          selection: { ...state.selection, packageId: id, packageName: name },
          pricing: initialPricing,
        }));
        if (id) get().fetchServerPricing();
      },

      toggleAddon: (id) => {
        const selectedAddonIds = get().selection.selectedAddonIds || [];
        const newAddons = selectedAddonIds.includes(id)
          ? selectedAddonIds.filter((a: string) => a !== id)
          : [...selectedAddonIds, id];

        set((state) => ({
          selection: { ...state.selection, selectedAddonIds: newAddons }
        }));
        get().fetchServerPricing();
      },

      setVendor: (id, name) => set((state) => ({
        selection: {
          ...state.selection,
          vendorId: id,
          vendorName: name,
          idempotencyKey: state.selection.idempotencyKey || crypto.randomUUID(),
        }
      })),

      setVendorInfo: (info) => set((state) => ({
        selection: {
            ...state.selection,
            vendorId: info.vendorId,
            vendorName: info.vendorName,
            serviceTypeId: info.serviceId,
            packageId: info.packageId,
            packageName: info.packageName,
            idempotencyKey: state.selection.idempotencyKey || crypto.randomUUID(),
        },
        items: [{
          vendorId: info.vendorId,
          vendorName: info.vendorName,
          serviceId: info.serviceId,
          packageId: info.packageId,
          packageName: info.packageName || "Premium Package",
          basePrice: info.basePrice || 0,
          selectedAddonIds: []
        }],
        serviceName: info.serviceName || state.serviceName,
        vendorName: info.vendorName || state.vendorName,
        serviceImage: info.serviceImage || state.serviceImage,
        status: 'IN_PROGRESS'
      })),

      setPricing: (newPricing) => set(() => ({
        pricing: { ...initialPricing, ...newPricing }
      })),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      setLocation: (location) => set((state) => ({
        eventDetails: { ...state.eventDetails, ...location }
      })),

      setEventDetails: (details) => {
        set((state) => ({
          eventDetails: { ...state.eventDetails, ...details }
        }));
        if (details.guestCount !== undefined && (get().selection.packageId || get().items.length > 0)) {
            get().fetchServerPricing();
        }
      },

      setGuestBreakdown: (breakdown) => {
        const current = get().eventDetails.guestBreakdown;
        const next = { ...current, ...breakdown };
        const total = (next.adults || 0) + (next.kids || 0) + (next.seniors || 0);

        set((state) => ({
          eventDetails: {
            ...state.eventDetails,
            guestBreakdown: next,
            guestCount: total
          }
        }));

        if (get().selection.packageId || get().items.length > 0) {
            get().fetchServerPricing();
        }
      },

      setVenueFeatures: (features) => set((state) => ({
        eventDetails: {
          ...state.eventDetails,
          venueFeatures: { ...state.eventDetails.venueFeatures, ...features }
        }
      })),

      fetchServerPricing: async () => {
        const { packageId, selectedAddonIds = [] } = get().selection;
        const { items } = get();
        const { guestCount } = get().eventDetails;

        console.log("[CheckoutStore] fetchServerPricing Payload:", {
            items: items.length > 0 ? items : [{ packageId, selectedAddonIds }],
            guestCount: guestCount || 100
        });

        set({ isPricingLoading: true });
        try {
          const res = await apiClient.post("/bookings/calculate", {
            items: items.length > 0 ? items : [{ packageId, selectedAddonIds }],
            guestCount: guestCount || 100
          }, { timeout: 15000 }); // Increase timeout to 15s
          set({ pricing: res.data });
        } catch (error: any) {
          console.error("Failed to calculate pricing:", error);
          if (error.code === 'ECONNABORTED') {
            console.error("Pricing request timed out after 15s");
          }
        } finally {
          set({ isPricingLoading: false });
        }
      },

      calculatePricing: (packagePrice) => {
        const { guestCount } = get().eventDetails;
        const subtotal = Number(packagePrice) * guestCount;
        const platformFee = (subtotal * BUSINESS_CONFIG.PLATFORM_FEE_PERCENTAGE) / 100;
        const taxes = ((subtotal + platformFee) * BUSINESS_CONFIG.GST_PERCENTAGE) / 100;
        const total = subtotal + platformFee + taxes;

        set((state) => ({
            pricing: { ...state.pricing, subtotal, taxes, platformFee, total }
        }));
      },

      resetCheckout: () => set({
        isStarted: false,
        step: 1,
        selection: initialSelection,
        items: [],
        eventDetails: initialEventDetails,
        pricing: initialPricing,
        paymentMethod: null,
        isPricingLoading: false,
        isAgreed: false,
        serviceImage: null,
        serviceName: null,
        vendorName: null,
        status: 'DRAFT',
      }),
    }),
    {
      name: "mana-checkout-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isStarted: state.isStarted,
        step: state.step,
        selection: state.selection,
        items: state.items,
        eventDetails: state.eventDetails,
        pricing: state.pricing,
        paymentMethod: state.paymentMethod,
        isAgreed: state.isAgreed,
        serviceName: state.serviceName,
        vendorName: state.vendorName,
        serviceImage: state.serviceImage,
        status: state.status,
      }),
    }
  )
);
