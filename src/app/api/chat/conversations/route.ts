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
  });
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const { bookingId, participantId } = await req.json();

    // Check if conversation already exists for this booking
    if (bookingId) {
      const existing = await prisma.conversation.findUnique({
        where: { bookingId },
        include: { conversationparticipant: true }
      });
      if (existing) return NextResponse.json(existing);
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
  });
}
