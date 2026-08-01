import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import logger from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { TimelineService } from "@/services/server/timeline.service";
import { ChecklistService } from "@/services/server/checklist.service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { status, notes } = await req.json();

    // 1. Fetch current booking to identify performer
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
          customerprofile: {
              include: {
                  user: { select: { fullName: true, id: true } }
              }
          },
          vendorprofile: { select: { userId: true, businessName: true } }
      }
    });

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    // 2. Identify Performer
    const performer = { id: payload.userId, name: "System", role: payload.role };
    if (payload.role === "CUSTOMER") {
        performer.name = booking.customerprofile?.user.fullName || "Customer";
    } else if (payload.role === "VENDOR") {
        if (booking.vendorprofile?.userId !== payload.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }
        performer.name = booking.vendorprofile.businessName;
    }

    // 3. Transition via State Machine (Handles timeline, audit, and validation)
    try {
        const updatedBooking = await TimelineService.transitionStatus(
            bookingId,
            status,
            performer,
            notes
        );

        // --- Side Effects based on new Status ---

        // a. Initialize Checklist on Confirmation
        if (status === "CONFIRMED") {
            await ChecklistService.initializeChecklist(bookingId);
        }

        // b. Handle Chat logic
        if (status === "CONFIRMED") {
            const existingChat = await prisma.conversation.findUnique({ where: { bookingId } });
            if (!existingChat && booking.vendorprofile && booking.customerprofile) {
                await prisma.conversation.create({
                    data: {
                        id: crypto.randomUUID(),
                        bookingId,
                        updatedAt: new Date(),
                        conversationparticipant: {
                            create: [
                                { id: crypto.randomUUID(), userId: booking.customerprofile.userId },
                                { id: crypto.randomUUID(), userId: booking.vendorprofile.userId }
                            ]
                        }
                    }
                });
            }
        }

        // Trigger notifications via Inngest or directly
        const { NotificationTriggers } = await import("@/lib/notifications");
        await NotificationTriggers.bookingStatusUpdated(updatedBooking, status);

        logger.info("Enterprise status transition successful", { bookingId, status });
        return NextResponse.json(updatedBooking);

    } catch (error: any) {
        logger.error("Status transition failed", { bookingId, status, error: error.message });
        return NextResponse.json({ message: error.message }, { status: 400 });
    }
  });
}
