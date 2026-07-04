import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CheckoutStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface CheckoutState {
  step: CheckoutStep;
  eventDetails: {
    type: string;
    name: string;
    description: string;
  };
  guestInfo: {
    count: number;
    requirements: string;
  };
  dateTime: {
    date: string;
    time: string;
  };
  location: {
    address: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    coordinates?: { lat: number; lng: number };
  };
  vendorInfo: {
    vendorId: string;
    packageId?: string;
    serviceId: string;
    vendorName: string;
    packageName?: string;
    basePrice: number;
  };
  pricing: {
    subtotal: number;
    taxes: number;
    platformFee: number;
    total: number;
    breakdown?: {
      base: number;
      guests: number;
      extra: number;
      platform: number;
      tax: number;
      total: number;
    };
  };

  setStep: (step: CheckoutStep) => void;
  setEventDetails: (details: CheckoutState["eventDetails"]) => void;
  setGuestInfo: (info: CheckoutState["guestInfo"]) => void;
  setDateTime: (dateTime: CheckoutState["dateTime"]) => void;
  setLocation: (location: CheckoutState["location"]) => void;
  setVendorInfo: (info: CheckoutState["vendorInfo"]) => void;
  setPricing: (pricing: CheckoutState["pricing"]) => void;
  calculatePricing: () => void;
  resetCheckout: () => void;
}

export const PLATFORM_FEE_PERCENT = 0.05; // 5%
export const TAX_PERCENT = 0.18; // 18% GST

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      step: 1,
      eventDetails: { type: "", name: "", description: "" },
      guestInfo: { count: 50, requirements: "" },
      dateTime: { date: "", time: "" },
      location: { address: "", landmark: "", city: "", state: "", pincode: "" },
      vendorInfo: { vendorId: "", serviceId: "", vendorName: "", basePrice: 0 },
      pricing: { subtotal: 0, taxes: 0, platformFee: 0, total: 0 },

      setStep: (step) => set({ step }),
      setEventDetails: (eventDetails) => set({ eventDetails }),
      setGuestInfo: (guestInfo) => {
        set({ guestInfo });
        get().calculatePricing();
      },
      setDateTime: (dateTime) => set({ dateTime }),
      setLocation: (location) => set({ location }),
      setVendorInfo: (vendorInfo) => {
        set({ vendorInfo });
        get().calculatePricing();
      },
      setPricing: (pricing) => set({ pricing }),
      calculatePricing: () => {
        const { basePrice } = get().vendorInfo;
        // Basic calculation as fallback
        const subtotal = basePrice;
        const platformFee = subtotal * PLATFORM_FEE_PERCENT;
        const taxes = (subtotal + platformFee) * TAX_PERCENT;
        const total = subtotal + platformFee + taxes;

        // We don't overwrite if a detailed breakdown already exists from the wizard
        if (!get().pricing.breakdown) {
          set({ pricing: { subtotal, taxes, platformFee, total } });
        }
      },
      resetCheckout: () => set({
        step: 1,
        eventDetails: { type: "", name: "", description: "" },
        guestInfo: { count: 50, requirements: "" },
        dateTime: { date: "", time: "" },
        location: { address: "", landmark: "", city: "", state: "", pincode: "" },
        vendorInfo: { vendorId: "", serviceId: "", vendorName: "", basePrice: 0 },
        pricing: { subtotal: 0, taxes: 0, platformFee: 0, total: 0 },
      }),
    }),
    { name: "mana-checkout-storage" }
  )
);
