import { BUSINESS_CONFIG } from "@/constants/config";

/**
 * Calculates GST amount for a given base price
 */
export const calculateGST = (amount: number): number => {
  return (amount * BUSINESS_CONFIG.GST_PERCENTAGE) / 100;
};

/**
 * Calculates platform fee for a given base price
 */
export const calculatePlatformFee = (amount: number): number => {
  return (amount * BUSINESS_CONFIG.PLATFORM_FEE_PERCENTAGE) / 100;
};

/**
 * Calculates total amount including GST and platform fee
 */
export const calculateTotalAmount = (amount: number): number => {
  const gst = calculateGST(amount);
  const platformFee = calculatePlatformFee(amount);
  return amount + gst + platformFee;
};
