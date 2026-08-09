import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { verifyAdminRequest } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const admin = await verifyAdminRequest(req);
    if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const customer = await prisma.customerprofile.findUnique({
      where: { id },
      include: {
        user: true,
        booking: {
            take: 5,
            orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!customer) return NextResponse.json({ message: "Customer not found" }, { status: 404 });

    const data = {
        ...customer,
        full_name: customer.user.fullName,
        email: customer.user.email,
        status: "active", // Assuming active for now
        joined_at: customer.createdAt,
        wallet_balance: Number(customer.loyaltyPoints ?? 0)
    };

    return NextResponse.json(data);
  }, req);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    return withErrorHandler(async () => {
      const { id } = await params;
      const admin = await verifyAdminRequest(req);
      if (!admin) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      const body = await req.json();
      const { status } = body;

      // Map 'active'/'blocked' to user model's boolean if exists, or role-based check
      // For now, let's assume we update the user associated with this profile
      const customer = await prisma.customerprofile.findUnique({
          where: { id },
          select: { userId: true }
      });

      if (!customer) return NextResponse.json({ message: "Customer not found" }, { status: 404 });

      // If 'status' is 'blocked', we might set a lockUntil in the future
      await prisma.user.update({
          where: { id: customer.userId },
          data: {
              lockUntil: status === 'blocked' ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) : null
          }
      });

      return NextResponse.json({ success: true });
    }, req);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    return withErrorHandler(async () => {
      const { id } = await params;
      const admin = await verifyAdminRequest(req);
      if (!admin || admin.role !== 'SUPER_ADMIN') {
          return NextResponse.json({ message: "Only Super Admins can delete customers" }, { status: 403 });
      }

      await prisma.customerprofile.delete({
          where: { id }
      });

      return NextResponse.json({ success: true });
    }, req);
}
