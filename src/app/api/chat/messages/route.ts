import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");

  if (!conversationId) return NextResponse.json({ message: "Conversation ID is required" }, { status: 400 });

  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        user: {
          select: { id: true, fullName: true, role: true }
        },
        messageattachment: true
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = verifyAccessToken(token);
  if (!payload) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { conversationId, content, attachments } = await req.json();

    const message = await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        conversationId,
        senderId: payload.userId,
        content,
        messageattachment: {
          create: attachments?.map((a: any) => ({
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

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
