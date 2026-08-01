import { z } from "zod";

export const razorpayOrderSchema = z.object({
  amount: z.number().positive(),
  bookingId: z.string().optional(),
  currency: z.string().default("INR"),
  paymentType: z.enum(["FULL", "ADVANCE", "BALANCE", "SUBSCRIPTION"]).default("FULL"),
});

export const razorpayVerifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  bookingId: z.string().optional(),
});

export type RazorpayOrderInput = z.infer<typeof razorpayOrderSchema>;
export type RazorpayVerifyInput = z.infer<typeof razorpayVerifySchema>;
