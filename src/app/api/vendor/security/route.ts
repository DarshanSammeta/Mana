import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, comparePassword, hashPassword } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import { SessionService } from "@/services/server/session.service";
import logger from "@/lib/logger";
import { createHash } from "crypto";

export async function PUT(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { currentPassword, newPassword, twoFactorEnabled } = body;

    // Handle Password Change
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { password: true }
      });

      if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

      const isMatch = await comparePassword(currentPassword, user.password);
      if (!isMatch) return NextResponse.json({ message: "Incorrect current password" }, { status: 400 });

      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: payload.userId },
        data: { password: hashedPassword }
      });

      // Revoke other sessions
      const cookieHeader = req.headers.get("cookie") || "";
      const refreshToken = cookieHeader.split("; ").find(c => c.startsWith("refreshToken="))?.split("=")[1];
      let hashedCurrent = undefined;
      if (refreshToken) {
          hashedCurrent = createHash("sha256").update(refreshToken).digest("hex");
      }
      await SessionService.revokeAllUserSessions(payload.userId, hashedCurrent);

      logger.info("Password updated successfully", { userId: payload.userId });
    }

    // Handle 2FA Toggle
    if (typeof twoFactorEnabled === "boolean") {
      await prisma.user.update({
        where: { id: payload.userId },
        data: { twoFactorEnabled }
      });
      logger.info("2FA state updated", { userId: payload.userId, enabled: twoFactorEnabled });
    }

    return NextResponse.json({ success: true });
  }, req);
}
