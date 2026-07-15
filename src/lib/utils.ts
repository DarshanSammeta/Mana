import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats a numeric value to a fixed number of decimal places.
 * Handles null, undefined, NaN, and Infinity by returning a fallback.
 */
export function formatNumber(value: any, decimals: number = 0, fallback: string = "0"): string {
  const num = Number(value);
  if (value === null || value === undefined || isNaN(num) || !isFinite(num)) {
    return fallback;
  }
  return num.toFixed(decimals);
}

export function formatRating(rating: any): string {
  return formatNumber(rating, 1, "0.0");
}

export function formatDistance(distance: any): string {
  const num = Number(distance);
  if (distance === null || distance === undefined || isNaN(num) || !isFinite(num)) {
    return "0.0";
  }
  if (num < 1) {
    return `${(num * 1000).toFixed(0)}m`;
  }
  return `${num.toFixed(1)}km`;
}

export function formatCurrency(amount: any): string {
  const num = Number(amount);
  if (amount === null || amount === undefined || isNaN(num) || !isFinite(num)) {
    return "₹0";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatPercentage(value: any): string {
  return `${formatNumber(value, 0, "0")}%`;
}
