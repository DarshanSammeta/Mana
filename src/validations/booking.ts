import { z } from "zod";

export const bookingSchema = z.object({
  vendorId: z.string(),
  eventTypeId: z.string(),
  categoryId: z.string(),
  subcategoryId: z.string(),
  serviceTypeId: z.string(),
  packageId: z.string(),
  selectedAddonIds: z.array(z.string()).optional().default([]),
  eventDate: z.string(),
  eventTime: z.string().optional().default("12:00"),
  eventLocation: z.string().min(5, "Address must be at least 5 characters long"),
  landmark: z.string().optional(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  guestCount: z.coerce.number().int().positive(),
  eventName: z.string().min(2),
  eventDescription: z.string().optional(),
  specialInstructions: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  idempotencyKey: z.string().optional(),
  isDraft: z.boolean().optional().default(false),
  couponCode: z.string().optional(),
});

export const acceptBookingSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT", "NEGOTIATE"]),
  notes: z.string().optional(),
  counterQuote: z.number().positive().optional(),
});

export const negotiateBookingSchema = z.object({
  totalAmount: z.number().positive(),
  notes: z.string().optional(),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(5, "Reason must be at least 5 characters long"),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const checkoutItemSchema = z.object({
  serviceId: z.string(),
  packageId: z.string(),
  selectedAddonIds: z.array(z.string()).default([]),
});

export const checkoutSchema = z.object({
  vendorId: z.string(),
  eventName: z.string().min(2),
  eventDate: z.string(),
  eventTime: z.string().optional().default("12:00"),
  eventLocation: z.string().min(5, "Address must be at least 5 characters long"),
  landmark: z.string().optional(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  guestCount: z.number().int().positive(),
  specialInstructions: z.string().optional(),
  idempotencyKey: z.string(),
  clientTotal: z.number().positive(),
  items: z.array(checkoutItemSchema).min(1),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AcceptBookingInput = z.infer<typeof acceptBookingSchema>;
export type NegotiateBookingInput = z.infer<typeof negotiateBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
