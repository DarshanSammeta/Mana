import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

async function checkAdmin(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params; // Document ID
    const { status, notes } = await req.json(); // APPROVED, REJECTED

    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const document = await prisma.vendordocument.update({
      where: { id },
      data: { status },
      include: { vendorprofile: { include: { user: true } } }
    });

    // Notify Vendor
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: document.vendorprofile.userId,
        title: `Document ${status}`,
        message: `Your ${document.type} document has been ${status.toLowerCase()}. ${notes || ""}`,
        category: "SYSTEM",
        priority: "MEDIUM",
        link: "/vendor/settings/verification"
      }
    });

    // If all documents are approved, update vendor profile status
    if (status === "APPROVED") {
      const allDocs = await prisma.vendordocument.findMany({
        where: { vendorProfileId: document.vendorProfileId }
      });

      const allApproved = allDocs.every(d => d.status === "APPROVED");
      const requiredTypes = ["AADHAAR", "PAN", "BUSINESS_LICENSE"];
      const hasAllRequired = requiredTypes.every(type => allDocs.some(d => d.type === type && d.status === "APPROVED"));

      if (allApproved && hasAllRequired) {
        await prisma.vendorprofile.update({
          where: { id: document.vendorProfileId },
          data: { verificationStatus: "APPROVED" }
        });
        logger.info("Vendor profile auto-approved after document verification", { vendorId: document.vendorProfileId });
      }
    } else if (status === "REJECTED") {
        await prisma.vendorprofile.update({
            where: { id: document.vendorProfileId },
            data: { verificationStatus: "REJECTED" }
        });
        logger.info("Vendor profile set to REJECTED due to document rejection", { vendorId: document.vendorProfileId, documentId: id });
    }

    logger.info("Vendor document status updated by admin", { adminId: admin.userId, documentId: id, status });

    return NextResponse.json(document);
  });
}
