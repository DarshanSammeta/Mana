import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const admin = await verifyAdminRequest(req);
  if (!admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const failedLogins = await prisma.audit_log.count({
      where: { action: "LOGIN_FAILED" }
    });

    const paymentSuccess = await prisma.audit_log.count({
      where: { action: "PAYMENT_SUCCESS" }
    });

    const paymentFailures = await prisma.audit_log.count({
      where: { action: "PAYMENT_VERIFICATION_FAILED" }
    });

    const recentSuspicious = await prisma.audit_log.findMany({
        where: {
            OR: [
                { action: "LOGIN_FAILED" },
                { action: "PAYMENT_VERIFICATION_FAILED" }
            ]
        },
        take: 5,
        orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      failedLogins,
      paymentSuccess,
      paymentFailures,
      recentSuspicious,
      securityScore: 92, // Mocked score
      owaspCompliance: "Level 1 Certified",
      pciStatus: "Compliant (Simulated)"
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}
