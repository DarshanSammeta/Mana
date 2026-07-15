import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { OperationsService } from "@/services/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { bookingId, reason } = await req.json();
    const cancellation = await OperationsService.cancelBooking(bookingId, session.user.id, reason);
    return NextResponse.json(cancellation);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
