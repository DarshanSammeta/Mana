import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { vendorDocumentSchema } from "@/validations/vendor";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { type, url } = vendorDocumentSchema.parse(body);

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId }
    });

    if (!vendorProfile) {
      return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });
    }

    const document = await prisma.vendordocument.create({
      data: {
        id: crypto.randomUUID(),
        vendorProfileId: vendorProfile.id,
        type,
        url,
        status: "PENDING"
      }
    });

    // If there were rejected documents, check if this upload addresses one
    if (vendorProfile.rejectedDocuments) {
        const rejected = vendorProfile.rejectedDocuments as string[];
        if (rejected.includes(type)) {
            const newRejected = rejected.filter(doc => doc !== type);
            await prisma.vendorprofile.update({
                where: { id: vendorProfile.id },
                data: {
                    rejectedDocuments: newRejected,
                    // If all rejected documents are replaced, we can potentially auto-trigger a re-review status
                    // verificationStatus: newRejected.length === 0 ? "PENDING" : vendorProfile.verificationStatus
                }
            });
        }
    }

    // Notify Admin (optional, could use a utility here)
    await prisma.notification.create({
        data: {
            id: crypto.randomUUID(),
            userId: "ADMIN_ID", // Placeholder: In a real app, find admin users or use a system-wide alert
            title: "New Document for Verification",
            message: `Vendor ${vendorProfile.businessName} uploaded a ${type} document.`,
            category: "SYSTEM",
            priority: "MEDIUM"
        }
    }).catch(err => console.error("Failed to notify admin:", err));

    return NextResponse.json(document, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId }
    });

    if (!vendorProfile) {
      return NextResponse.json({ message: "Vendor profile not found" }, { status: 404 });
    }

    const documents = await prisma.vendordocument.findMany({
      where: { vendorProfileId: vendorProfile.id }
    });

    return NextResponse.json(documents);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
