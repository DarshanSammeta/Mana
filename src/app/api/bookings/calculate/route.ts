import { NextResponse } from "next/server";
import { pricingService } from "@/services/server/pricing.service";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(req: Request) {
  const start = performance.now();
  const requestId = req.headers.get("x-request-id") || "unknown";
  console.log(`[API/Calculate] Request Incoming at ${new Date().toISOString()} | RID: ${requestId}`);

  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.headers.get("cookie")?.split("; ").find(c => c.startsWith("accessToken="))?.split("=")[1];
    const token = authHeader?.split(" ")[1] || cookieToken;

    if (!token) {
        console.error(`[API/Calculate] Unauthorized: No Token | RID: ${requestId}`);
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const authStart = performance.now();
    const payload = await verifyAccessToken(token);
    const authEnd = performance.now();

    if (!payload) {
        console.error(`[API/Calculate] Forbidden: Invalid Token | RID: ${requestId}`);
        return NextResponse.json({ status: 403 });
    }

    const body = await req.json();
    const { packageId, guestCount, addonIds, items } = body;

    console.log(`[API/Calculate] Body: ${JSON.stringify(body)} | RID: ${requestId}`);

    if (!packageId && (!items || items.length === 0)) {
      console.error(`[API/Calculate] Bad Request: Missing packageId or items | RID: ${requestId}`);
      return NextResponse.json({
        message: "Package ID or Items array is required",
        missingFields: ["packageId", "items"]
      }, { status: 400 });
    }

    const calcStart = performance.now();
    let pricing;
    if (items && items.length > 0) {
      console.log(`[API/Calculate] Executing Multi-Item Calculation | RID: ${requestId}`);
      pricing = await pricingService.calculateMultiItemPrice(items, guestCount || 100);
    } else {
      console.log(`[API/Calculate] Executing Single-Item Calculation | RID: ${requestId}`);
      pricing = await pricingService.calculateBookingPrice({
        packageId,
        guestCount: guestCount || 1,
        addonIds: addonIds || []
      });
    }
    const calcEnd = performance.now();

    const totalTime = performance.now() - start;
    console.log(`[API/Calculate] [PERF] RID: ${requestId} | Auth: ${(authEnd - authStart).toFixed(2)}ms | Calc: ${(calcEnd - calcStart).toFixed(2)}ms | Total: ${totalTime.toFixed(2)}ms`);

    return NextResponse.json(pricing);
  } catch (error: any) {
    const totalTime = performance.now() - start;
    console.error(`[API/Calculate] Critical Error after ${totalTime.toFixed(2)}ms: ${error.message} | RID: ${requestId}`);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
