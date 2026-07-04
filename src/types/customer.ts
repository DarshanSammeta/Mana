import { BookingStatus } from "./booking";

export interface CustomerStats {
  activeBookings: number;
  wishlistCount: number;
  walletBalance: number;
  totalSpending: number;
  recentBookings: CustomerRecentBooking[];
}

export interface CustomerRecentBooking {
  id: string;
  bookingNumber: string;
  vendorName: string;
  vendorLogo: string | null;
  eventDate: string;
  status: BookingStatus;
  totalAmount: number;
  serviceTitle: string;
}
