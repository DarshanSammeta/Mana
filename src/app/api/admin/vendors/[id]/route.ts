import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

async function checkAdmin(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return null;
  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params; // Vendor Profile ID

    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const vendor = await prisma.vendorprofile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            mobileNumber: true,
            createdAt: true
          }
        },
        vendordocument: true,
        vendorsubscription: {
            include: {
                subscriptionplan: true
            }
        }
      }
    });

    if (!vendor) {
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(vendor);
  }, req);
}
