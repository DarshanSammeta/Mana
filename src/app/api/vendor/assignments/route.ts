import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const assignments = await prisma.bookingassignment.findMany({
      where: {
        vendorprofile: { userId: payload.userId },
        status: "PENDING",
      },
      select: {
        id: true,
        priority: true,
        createdAt: true,
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            eventName: true,
            eventDate: true,
            totalAmount: true,
            user: { select: { fullName: true } },
            bookingitem: {
              select: {
                id: true,
                price: true,
                quantity: true,
                service: { select: { title: true } },
                Renamedpackage: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(assignments);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { assignmentId, action } = await req.json(); // action: 'ACCEPT' | 'REJECT'

    const assignment = await prisma.bookingassignment.findUnique({
      where: { id: assignmentId },
      include: {
        vendorprofile: true,
        booking: true,
      },
    });

    if (!assignment || assignment.vendorprofile.userId !== payload.userId) {
      return NextResponse.json({ message: "Assignment not found" }, { status: 404 });
    }

    if (action === "ACCEPT") {
      // Check if vendor is verified (Step 7: Verification Security)
      if (assignment.vendorprofile.verificationStatus !== "APPROVED") {
        return NextResponse.json({
          message: "Verification pending. You cannot accept bookings until your documents are approved by the admin."
        }, { status: 403 });
      }

      // 1. Update assignment status
      await prisma.bookingassignment.update({
        where: { id: assignmentId },
        data: { status: "ACCEPTED" },
      });

      // 2. Assign vendor to booking and update status
      await prisma.booking.update({
        where: { id: assignment.bookingId },
        data: {
          vendorId: assignment.vendorId,
          status: "VENDOR_ASSIGNED",
        },
      });

      // 3. Log status change
      await prisma.bookingstatuslog.create({
        data: {
          id: crypto.randomUUID(),
          bookingId: assignment.bookingId,
          status: "VENDOR_ASSIGNED",
          notes: `Vendor ${assignment.vendorprofile.businessName} accepted the assignment.`,
        },
      });

      // 4. Reject other pending assignments for this booking
      await prisma.bookingassignment.updateMany({
        where: {
          bookingId: assignment.bookingId,
          id: { not: assignmentId },
          status: "PENDING",
        },
        data: { status: "REASSIGNED" },
      });

      // 5. Notify Customer (Step 6)
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: assignment.booking.customerId,
          title: "Vendor Assigned!",
          message: `Vendor ${assignment.vendorprofile.businessName} has accepted your booking #${assignment.booking.bookingNumber}.`,
          category: "BOOKING",
          priority: "HIGH",
          link: `/customer/bookings/${assignment.bookingId}`
        }
      });

      // Emit Socket Event for Real-time Update
      try {
        const { emitSocketEvent } = await import("@/lib/socket-helper");
        emitSocketEvent(assignment.booking.customerId, "BOOKING_UPDATED", {
          bookingId: assignment.bookingId,
          status: "VENDOR_ASSIGNED",
          vendorName: assignment.vendorprofile.businessName
        });
      } catch (e) { console.error("Socket error", e); }

      return NextResponse.json({ message: "Assignment accepted successfully" });
    } else if (action === "REJECT") {
      await prisma.bookingassignment.update({
        where: { id: assignmentId },
        data: { status: "REJECTED" },
      });

      return NextResponse.json({ message: "Assignment rejected" });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
