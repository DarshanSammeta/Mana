import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const conversations = await prisma.conversation.findMany({
      where: {
        conversationparticipant: {
          some: {
            userId: payload.userId
          }
        }
      },
      select: {
        id: true,
        bookingId: true,
        updatedAt: true,
        conversationparticipant: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                fullName: true,
                role: true,
                vendorprofile: {
                  select: { logo: true, businessName: true }
                }
              }
            }
          }
        },
        message: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            isRead: true
          },
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(conversations);
  }, req);
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { bookingId, participantId } = await req.json();

    if (!participantId) return NextResponse.json({ message: "Participant ID is required" }, { status: 400 });

    // Security check: Only allow creating conversations for bookings where the user is involved
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { customerId: true, vendorprofile: { select: { userId: true } } }
      });

      if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

      const isCustomer = booking.customerId === payload.userId;
      const isVendor = booking.vendorprofile?.userId === payload.userId;

      if (!isCustomer && !isVendor) {
        logger.warn("Unauthorized chat creation attempt for booking", { userId: payload.userId, bookingId });
        return NextResponse.json({ message: "Access denied" }, { status: 403 });
      }

      // Ensure the other participant is indeed part of this booking
      const otherIsCustomer = booking.customerId === participantId;
      const otherIsVendor = booking.vendorprofile?.userId === participantId;

      if (!otherIsCustomer && !otherIsVendor) {
        return NextResponse.json({ message: "Invalid participant for this booking" }, { status: 400 });
      }

      const existing = await prisma.conversation.findUnique({
        where: { bookingId },
        include: { conversationparticipant: true }
      });
      if (existing) return NextResponse.json(existing);
    } else {
      // If no bookingId, we might want to restrict conversation creation entirely or to specific roles
      // For Mana Events, chat is usually booking-driven.
      return NextResponse.json({ message: "Conversations must be linked to a booking" }, { status: 400 });
    }

    const conversation = await prisma.conversation.create({
      data: {
        id: crypto.randomUUID(),
        bookingId,
        updatedAt: new Date(),
        conversationparticipant: {
          create: [
            { id: crypto.randomUUID(), userId: payload.userId },
            { id: crypto.randomUUID(), userId: participantId }
          ]
        }
      },
      include: { conversationparticipant: true }
    });

    logger.info("New conversation created", { userId: payload.userId, participantId, bookingId });

    return NextResponse.json(conversation, { status: 201 });
  }, req);
}
