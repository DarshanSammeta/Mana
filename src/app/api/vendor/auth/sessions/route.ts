import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { cookies } from "next/headers";
import { createHash } from "crypto";

export async function GET(req: Request) {
  const start = Date.now();
  const requestId = req.headers.get("x-request-id") || `sess_${Math.random().toString(36).substring(7)}`;

  return withErrorHandler(async () => {
    console.log(`[TRACE] [${requestId}] 1. Session Route Entry`);

    const userId = req.headers.get("x-user-id");
    let finalUserId = userId;

    if (!finalUserId) {
        console.log(`[TRACE] [${requestId}] 2. Auth Fallback`);
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        const payload = await verifyAccessToken(token);
        if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        finalUserId = payload.userId;
    }

    console.log(`[TRACE] [${requestId}] 3. Prisma Start`);
    const sessions = await prisma.refreshtoken.findMany({
      where: { userId: finalUserId, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        lastUsedAt: true,
        expiryDate: true,
        ipAddress: true,
        browser: true,
        os: true,
        deviceName: true,
      }
    });
    console.log(`[TRACE] [${requestId}] 4. Prisma End`);

    console.log(`[TRACE] [${requestId}] 5. Serialization Start`);
    const response = NextResponse.json(sessions);
    console.log(`[TRACE] [${requestId}] 6. Response Sent | Total: ${Date.now() - start}ms`);

    return response;
  }, req);
}

export async function DELETE(req: Request) {
  return withErrorHandler(async () => {
    const userId = req.headers.get("x-user-id");
    let finalUserId = userId;

    if (!finalUserId) {
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        const payload = await verifyAccessToken(token);
        if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        finalUserId = payload.userId;
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("id");
    const revokeOthers = url.searchParams.get("others") === "true";

    if (revokeOthers) {
       const cookieStore = await cookies();
       const currentRT = cookieStore.get("refreshToken")?.value;
       let currentHash = undefined;
       if (currentRT) {
           currentHash = createHash("sha256").update(currentRT).digest("hex");
       }

       await prisma.refreshtoken.deleteMany({
         where: {
           userId: finalUserId,
           tokenHash: currentHash ? { not: currentHash } : undefined
         }
       });
       logger.info("Other sessions revoked", { userId: finalUserId });
       return NextResponse.json({ message: "Other sessions revoked" });
    }

    if (sessionId) {
      await prisma.refreshtoken.delete({
        where: { id: sessionId, userId: finalUserId }
      });
      logger.info("Session revoked", { userId: finalUserId, sessionId });
      return NextResponse.json({ message: "Session revoked" });
    }

    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }, req);
}
