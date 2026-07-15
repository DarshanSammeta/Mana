import "server-only";
import { getPrisma } from "@/lib/prisma";
import { safeRedis } from "@/lib/redis";

export class FraudDetectionService {
  /**
   * Detects GPS spoofing by comparing current location with previous location
   * and calculating the implied speed.
   */
  static async detectGpsSpoofing(vendorId: string, newLat: number, newLng: number, timestamp: number) {
    const prisma = getPrisma();
    const lastLocationKey = `vendor:location:history:${vendorId}`;
    const lastLocationRaw = await safeRedis.get<string>(lastLocationKey);

    if (lastLocationRaw) {
      const last = JSON.parse(lastLocationRaw);
      const timeDiffHours = (timestamp - last.timestamp) / (1000 * 60 * 60);

      if (timeDiffHours > 0) {
        // Calculate haversine distance
        const distance = this.haversineDistance(last.lat, last.lng, newLat, newLng);
        const speed = distance / timeDiffHours;

        if (speed > 250) { // Over 250 km/h is highly suspicious for ground travel
          await prisma.fraud_detection_log.create({
            data: {
              userId: vendorId,
              type: "GPS_SPOOFING",
              severity: "CRITICAL",
              description: `Suspicious speed detected: ${speed.toFixed(2)} km/h`,
              evidence: { last, current: { lat: newLat, lng: newLng, timestamp }, speed }
            }
          });
          return true;
        }
      }
    }

    await safeRedis.set(lastLocationKey, { lat: newLat, lng: newLng, timestamp }, 3600);
    return false;
  }

  /**
   * Detects rapid acceptance and rejection patterns
   */
  static async monitorAssignmentPattern(vendorId: string, action: 'ACCEPT' | 'REJECT') {
    const prisma = getPrisma();
    const key = `fraud:assignment:${vendorId}:${action}`;
    const count = await safeRedis.incr(key);

    if (count === 1) await safeRedis.expire(key, 300); // 5 minute window

    if (count && count > 20) {
      await prisma.fraud_detection_log.create({
        data: {
          userId: vendorId,
          type: "RAPID_ACTION_PATTERN",
          severity: "MEDIUM",
          description: `Vendor ${action}ed ${count} assignments in 5 minutes`,
          evidence: { action, count }
        }
      });
    }
  }

  private static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
