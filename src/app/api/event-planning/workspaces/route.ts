import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(_req: Request) {
  const session = await auth();
  if (!session || !session.user) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const userEmail = session.user.email || undefined;
    const workspaces = await prisma.event_workspace.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          userEmail ? { collaborators: { some: { email: userEmail } } } : {}
        ]
      },
      include: {
        _count: {
          select: {
            checklist_items: true,
            guests: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(workspaces);
  } catch {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
