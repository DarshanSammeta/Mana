import { CURRENCY } from "@/constants/config";

/**
 * Formats a number as Indian Rupee (INR)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    style: "currency",
    currency: CURRENCY.CODE,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formats a date using Intl.DateTimeFormat
 */
export const formatDate = (
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  }
): string => {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-IN", options).format(d);
};

/**
 * Capitalizes the first letter of a string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Slugifies a string
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
};
