import { format as dateFnsFormat, isValid, parseISO } from "date-fns";

/**
 * Safely formats a date value.
 * Prevents RangeError: Invalid time value by validating the date before formatting.
 *
 * @param date - Date object, ISO string, number, or null/undefined
 * @param pattern - The date-fns format pattern (default: "PPP")
 * @param fallback - The string to return if the date is invalid (default: "N/A")
 * @returns Formatted date string or fallback
 */
export function formatSafe(
  date: Date | string | number | null | undefined,
  pattern: string = "PPP",
  fallback: string = "N/A"
): string {
  if (date === null || date === undefined || date === "" || date === "null") {
    return fallback;
  }

  let dateObj: Date;

  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === "string") {
    dateObj = parseISO(date);
    // If parseISO fails, try standard constructor
    if (!isValid(dateObj)) {
      dateObj = new Date(date);
    }
  } else {
    dateObj = new Date(date);
  }

  if (!isValid(dateObj)) {
    console.warn(`[formatSafe] Invalid date value encountered:`, date);
    return fallback;
  }

  try {
    return dateFnsFormat(dateObj, pattern);
  } catch (error) {
    console.error(`[formatSafe] Error formatting date:`, { date, pattern, error });
    return fallback;
  }
}

/**
 * Safely converts a date to ISO string.
 * Returns null if the date is invalid.
 */
export function toISOSafe(date: Date | string | number | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  return isValid(d) ? d.toISOString() : null;
}

