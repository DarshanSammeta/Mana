import { NextResponse } from 'next/server';
import { EventPlanningService } from '@/services/server/event-planning.service';
import { auth } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const workspace = await EventPlanningService.getWorkspace(id, session.user.id);
    if (!workspace) return new NextResponse('Not Found', { status: 404 });

    const analytics = await EventPlanningService.getPlanningAnalytics(id);

    return NextResponse.json({ ...workspace, analytics });
  } catch {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
