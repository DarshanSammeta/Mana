import { verifyAccessToken } from "./auth";
import { cookies } from "next/headers";

/**
 * Standardized server-side authentication helper.
 * Extracts token from Authorization header or Cookies.
 */
export async function getServerSession(req?: Request) {
  let token: string | undefined;

  console.log(`[getServerSession] 1. Extracting token...`);
  // 1. Try Authorization Header
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
      console.log(`[getServerSession] 1. Token found in header.`);
    }
  }

  // 2. Fallback to Cookies (Next.js context)
  if (!token) {
    try {
      console.log(`[getServerSession] 2. Awaiting cookies()...`);
      const cookieStore = await cookies();
      token = cookieStore.get("accessToken")?.value;
      if (token) console.log(`[getServerSession] 2. Token found in cookies.`);
    } catch (e: any) {
      console.warn(`[getServerSession] Cookies access failed: ${e.message}`);
    }
  }

  if (!token) {
    console.log(`[getServerSession] No token found.`);
    return null;
  }

  try {
    console.log(`[getServerSession] 3. Awaiting verifyAccessToken...`);
    const start = performance.now();
    const payload = await verifyAccessToken(token);
    console.log(`[getServerSession] 3. Token verified in ${(performance.now() - start).toFixed(2)}ms`);
    return payload;
  } catch (error: any) {
    console.error("[Auth-Server] Session verification failed:", error.message);
    return null;
  }
}
