import { z } from "zod";

export const bookingSchema = z.object({
  vendorId: z.string().uuid(),
  eventDate: z.string(),
  eventTime: z.string().optional(),
  eventLocation: z.string().min(5),
  city: z.string(),
  state: z.string(),
  items: z.array(z.object({
    serviceId: z.string().uuid(),
    packageId: z.string().uuid().optional(),
    quantity: z.number().int().positive().default(1),
  })).min(1),
});

export type BookingInput = z.infer<typeof bookingSchema>;
