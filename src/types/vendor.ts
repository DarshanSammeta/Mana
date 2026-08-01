import { User } from "./auth";
import { Booking } from "./booking";

export type VendorStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface Vendor {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  status: VendorStatus;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface VendorStats {
  totalRevenue: number;
  totalBookings: number;
  withdrawableRevenue: number;
  monthlyRevenue: number;
  dailyRevenue: { date: string; amount: number }[];
}

export interface VendorAssignment {
  id: string;
  bookingId: string;
  vendorId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  createdAt: Date;
  booking: Booking & {
    user: {
      fullName: string;
    };
    bookingitem: {
      service: {
        title: string;
      };
    }[];
    city: string;
    state: string;
  };
}

export interface VendorSubscription {
  id: string;
  vendorProfileId: string;
  planId: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "PAST_DUE";
  startDate: Date | string;
  endDate: Date | string;
  autoRenew: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  subscriptionplan: {
    id: string;
    name: string;
    listingLimit: number;
    price: number;
    features: any;
    rank: number;
  };
}

export interface VendorUsage {
  services: number;
  limit: number;
}
