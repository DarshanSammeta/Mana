import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params; // Vendor Profile ID

    const admin = await verifyAdminRequest(req);
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

    const data = {
        ...vendor,
        business_name: vendor.businessName,
        owner_name: vendor.user?.fullName || "—",
        email: vendor.user?.email || "—",
        phone: vendor.user?.mobileNumber || "—",
        address: `${vendor.address || ''} ${vendor.city || ''} ${vendor.state || ''}`.trim() || "—",
        status: vendor.verificationStatus === 'SUSPENDED' ? 'suspended' : 'active',
        kyc_status: vendor.verificationStatus.toLowerCase(),
        total_bookings: vendor.totalBookings ?? 0,
        created_at: vendor.createdAt
    };

    return NextResponse.json(data);
  }, req);
}
