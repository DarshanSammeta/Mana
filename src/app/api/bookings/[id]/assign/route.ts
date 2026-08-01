import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { TimelineService } from "@/services/server/timeline.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandler(async () => {
    const { id: bookingId } = await params;
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload || payload.role !== "VENDOR") return NextResponse.json({ status: 403 });

    const { memberIds, roleAtEvent } = await req.json();

    const vendorProfile = await prisma.vendorprofile.findUnique({
      where: { userId: payload.userId },
      select: { id: true, businessName: true }
    });

    if (!vendorProfile) return NextResponse.json({ message: "Vendor not found" }, { status: 404 });

    // 1. Verify booking ownership
    // Bug Fix: customerId field dropped. Updated select to exclude it as it wasn't being used in logic below,
    // or we can include customerProfileId if needed.
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { vendorId: true, status: true, customerProfileId: true }
    });

    if (!booking || booking.vendorId !== vendorProfile.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // 2. Perform assignments in transaction
    const assignments = await prisma.$transaction(async (tx) => {
        // Clear previous assignments for this booking
        await tx.booking_team_assignment.deleteMany({
            where: { bookingId }
        });

        const created = await Promise.all(memberIds.map((memberId: string) =>
            tx.booking_team_assignment.create({
                data: {
                    bookingId,
                    memberId,
                    roleAtEvent: roleAtEvent || "Execution Staff",
                    status: "ASSIGNED"
                },
                include: { member: true }
            })
        ));

        // 3. Automated Timeline & Transition
        if (booking.status === "CONFIRMED" || booking.status === "PREPARATION_STARTED") {
            await TimelineService.transitionStatus(
                bookingId,
                "VENDOR_ASSIGNED",
                { id: payload.userId, name: vendorProfile.businessName, role: "VENDOR" },
                `Assigned ${memberIds.length} team members for the event.`
            );
        } else {
             await TimelineService.addTimelineEntry(bookingId, {
                title: "Team Update",
                description: `Execution team members updated. Total: ${memberIds.length}`,
                performedBy: vendorProfile.businessName,
                role: "VENDOR",
                icon: "Users",
                color: "blue"
            });
        }

        return created;
    });

    logger.info("Team members assigned", { bookingId, count: memberIds.length });
    return NextResponse.json(assignments);
  }, req);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    return withErrorHandler(async () => {
        const { id: bookingId } = await params;
        const assignments = await prisma.booking_team_assignment.findMany({
            where: { bookingId },
            include: {
                member: true
            }
        });

        // Hide contact numbers if not event day (simplified for now)
        const isEventDay = false; // Logic to check if today is eventDate

        const sanitized = assignments.map(a => ({
            ...a,
            member: {
                ...a.member,
                phone: isEventDay ? a.member.phone : "Contact available on event day"
            }
        }));

        return NextResponse.json(sanitized);
    }, req);
}
