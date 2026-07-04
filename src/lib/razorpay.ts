import Razorpay from "razorpay";
import crypto from "crypto";

import { RAZORPAY_CONFIG } from "@/config/razorpay";

let razorpayInstance: Razorpay | null = null;

export const getRazorpay = () => {
  if (razorpayInstance) return razorpayInstance;

  const key_id = RAZORPAY_CONFIG.keyId;
  const key_secret = RAZORPAY_CONFIG.keySecret;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay API keys are missing");
  }

  razorpayInstance = new Razorpay({
    key_id,
    key_secret,
  });

  return razorpayInstance;
};

export const verifyWebhookSignature = (
  body: string,
  signature: string,
  secret: string
) => {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
};

export const razorpayReconcile = async (orderId: string) => {
  const razorpay = getRazorpay();
  try {
    const order = await razorpay.orders.fetch(orderId);
    const payments = await razorpay.orders.fetchPayments(orderId);
    return { order, payments: payments.items };
  } catch (error) {
    console.error("Razorpay reconciliation error:", error);
    throw error;
  }
};
