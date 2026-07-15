import { NextResponse } from 'next/server';
import { EventPlanningService } from '@/services/server/event-planning.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const suggestions = await EventPlanningService.getAISuggestions(id);
    return NextResponse.json(suggestions);
  } catch {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
