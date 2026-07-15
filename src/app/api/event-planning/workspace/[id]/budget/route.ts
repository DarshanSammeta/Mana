import { NextResponse } from 'next/server';
import { EventPlanningService } from '@/services/server/event-planning.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await req.json();
    const budgetItem = await EventPlanningService.addBudgetItem(id, body);
    return NextResponse.json(budgetItem);
  } catch {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
