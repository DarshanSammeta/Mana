import Razorpay from "razorpay";

let razorpayInstance: Razorpay | null = null;

export const getRazorpay = () => {
  if (razorpayInstance) return razorpayInstance;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    // We throw here only when called at runtime.
    // During build, this function won't be called.
    throw new Error("Razorpay API keys are missing");
  }

  razorpayInstance = new Razorpay({
    key_id,
    key_secret,
  });

  return razorpayInstance;
};
