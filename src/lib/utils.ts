import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export * from "./utils/date";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely formats a rating value to one decimal place.
 */
export function formatRating(rating: any): string {
  const num = Number(rating);
  if (rating === null || rating === undefined || isNaN(num) || !isFinite(num)) {
    return "0.0";
  }
  return num.toFixed(1);
}

/**
 * Formats a distance into a human-readable string.
 */
export function formatDistance(distance: any): string {
  const num = Number(distance);
  if (distance === null || distance === undefined || isNaN(num) || !isFinite(num)) {
    return "0.0km";
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

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
