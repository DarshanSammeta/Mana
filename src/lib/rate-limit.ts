import { NextResponse } from "next/server";

const rates = new Map<string, { count: number; lastReset: number }>();

export function rateLimit(ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rates.get(ip) || { count: 0, lastReset: now };

  if (now - current.lastReset > windowMs) {
    current.count = 1;
    current.lastReset = now;
  } else {
    current.count++;
  }

  rates.set(ip, current);

  if (current.count > limit) {
    return false;
  }
  return true;
}

// Memory cleaning interval (every hour)
if (typeof window === "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rates.entries()) {
      if (now - data.lastReset > 3600000) {
        rates.delete(ip);
      }
    }
  }, 3600000);
}
