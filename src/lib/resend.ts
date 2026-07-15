import { Resend } from 'resend';

let resendInstance: Resend | null = null;

export function getResend() {
  // Return null immediately if in browser to prevent constructor errors
  if (typeof window !== "undefined") return null;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY is missing. Resend service will be unavailable.");
    return null;
  }

  try {
    if (!resendInstance) {
      resendInstance = new Resend(apiKey);
    }
    return resendInstance;
  } catch (error) {
    console.error("Failed to initialize Resend:", error);
    return null;
  }
}
