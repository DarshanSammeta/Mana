export type BookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "NEGOTIATING"
  | "CONFIRMED"
  | "CANCELLED"
  | "VENDOR_ASSIGNED"
  | "VENDOR_TRAVELING"
  | "VENDOR_ARRIVED"
  | "OTP_VERIFICATION_PENDING"
  | "EVENT_STARTED"
  | "EVENT_ONGOING"
  | "EVENT_COMPLETED";

export interface BookingChecklistItem {
  id: number;
  task: string;
  completed: boolean;
}

export interface BookingTeamMember {
  id: string;
  name: string;
  role: string;
  phone: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  vendorId: string;
  status: BookingStatus;
  eventName?: string;
  eventType?: string;
  eventDescription?: string;
  eventDate: string | Date;
  eventTime?: string;
  eventLocation: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  guestCount?: number;
  totalAmount: number;
  subTotal?: number;
  taxAmount?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: {
    fullName: string;
    email: string;
    mobileNumber?: string;
  };
  bookingitem: {
    id: string;
    serviceId: string;
    packageId?: string;
    price: number;
    quantity: number;
    service: {
      id: string;
      title: string;
      basePrice?: number;
    };
    Renamedpackage?: {
      id: string;
      name: string;
      price: number;
    };
  }[];
  checklist?: BookingChecklistItem[];
  vendorPhoneVerified: boolean;
  vendorConfirmedAt5d: boolean | null;
  invoiceUrl?: string;
}
