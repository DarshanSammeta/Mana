import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

import { z } from "zod";

const messageSchema = z.object({
    conversationId: z.string(),
    content: z.string().min(1).max(5000),
    attachments: z.array(z.object({
        url: z.string().url(),
        type: z.string()
    })).optional()
});

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!conversationId) return NextResponse.json({ message: "Conversation ID is required" }, { status: 400 });

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rl = await rateLimit(`chat-read:${ip}:${conversationId}`, { limit: 60, window: 60 });
    if (!rl.success) return rateLimitResponse(rl);

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    // Security check: Verify user is a participant in the conversation
    const participant = await prisma.conversationparticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: payload.userId
        }
      }
    });

    if (!participant) {
      logger.warn("Unauthorized chat access attempt", { userId: payload.userId, conversationId });
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        id: true,
        content: true,
        createdAt: true,
        senderId: true,
        isRead: true,
        user: {
          select: { id: true, fullName: true, role: true }
        },
        messageattachment: {
          select: {
            id: true,
            url: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

    return NextResponse.json({
      items: messages.reverse(),
      nextCursor
    });
  }, req);
}

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rl = await rateLimit(`chat-send:${ip}`, { limit: 20, window: 60 });
    if (!rl.success) return rateLimitResponse(rl);

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { conversationId, content, attachments } = messageSchema.parse(body);

    // Security check: Verify user is a participant in the conversation
    const participant = await prisma.conversationparticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: payload.userId
        }
      }
    });

    if (!participant) {
      logger.warn("Unauthorized message post attempt", { userId: payload.userId, conversationId });
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        conversationId,
        senderId: payload.userId,
        content,
        messageattachment: {
          create: attachments?.map((a: { url: string; type: string }) => ({
            id: crypto.randomUUID(),
            url: a.url,
            type: a.type
          }))
        }
      },
      include: {
        user: {
          select: { id: true, fullName: true, role: true }
        },
        messageattachment: true
      }
    });

    // Side Effect: Real-time broadcast (Authorized by conversation ID)
    const { emitSocketEvent } = await import("@/lib/socket-helper");
    // Fetch participants to notify
    const participants = await prisma.conversationparticipant.findMany({
        where: { conversationId }
    });

    for (const p of participants) {
        if (p.userId !== payload.userId) {
            emitSocketEvent(p.userId, "chat:message", message);
        }
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    logger.info("Chat message sent", { conversationId, senderId: payload.userId, messageId: message.id });

    return NextResponse.json({
        success: true,
        message: "Message sent",
        data: message,
        requestId: req.headers.get("x-request-id")
    }, { status: 201 });
  }, req);
}
