export type BookingStatus =
  | "DRAFT"
  | "SEARCHING"
  | "PENDING"
  | "VENDORS_NOTIFIED"
  | "QUOTE_RECEIVED"
  | "NEGOTIATING"
  | "QUOTE_ACCEPTED"
  | "PAYMENT_PENDING"
  | "PENDING_ADVANCE"
  | "ADVANCE_PAID"
  | "VENDOR_REVIEW"
  | "BALANCE_PENDING"
  | "FULLY_PAID"
  | "REJECTED"
  | "CONFIRMED"
  | "CANCELLED"
  | "PREPARATION"
  | "PREPARATION_STARTED"
  | "VENDOR_ASSIGNED"
  | "VENDOR_TRAVELING"
  | "VENDOR_EN_ROUTE"
  | "VENDOR_ARRIVED"
  | "OTP_VERIFICATION_PENDING"
  | "EVENT_STARTED"
  | "EVENT_ONGOING"
  | "EVENT_COMPLETED"
  | "CUSTOMER_CONFIRMED"
  | "PAYMENT_RELEASED"
  | "CLOSED"
  | "DISPUTED"
  | "IN_PROGRESS"
  | "EMERGENCY"
  | "ARCHIVED"
  | "REFUND_PENDING"
  | "REFUND_COMPLETED"
  | "EXPIRED"
  | "PENDING_VENDOR_RESPONSE"
  | "COUNTERED"
  | "ACCEPTED"
  | "ADVANCE_PAYMENT_PENDING"
  | "COUNTER_REJECTED"
  | "PAYMENT_EXPIRED";

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
  customerProfileId: string;
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
  discountAmount?: number;
  advanceAmount?: number;
  balanceAmount?: number;
  commissionAmount?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  customerprofile?: {
    userId: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      mobileNumber: string;
    };
  };
  // Maintain 'user' property for backward compatibility where flattening is used
  user?: {
    fullName: string;
    email: string;
    mobileNumber?: string;
  };
  vendorprofile?: {
    id: string;
    businessName: string;
    logo?: string;
    description?: string;
    userId: string;
    city?: string;
    state?: string;
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
  viewedByVendor?: boolean;
  counterquote?: {
    id: string;
    version: number;
    totalAmount: number;
    notes?: string;
    status: string;
    createdAt: string;
  }[];
}
