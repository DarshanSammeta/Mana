import { NextResponse } from 'next/server';
import { EventPlanningService } from '@/services/server/event-planning.service';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await req.json();
    const workspace = await EventPlanningService.createWorkspace(session.user.id, {
      ...body,
      userEmail: session.user.email,
    });
    return NextResponse.json(workspace);
  } catch {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
