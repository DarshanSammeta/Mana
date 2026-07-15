import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { WalletService } from "@/services/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const wallet = await WalletService.getWallet(session.user.id);
    return NextResponse.json(wallet);
  } catch {
    return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 });
  }
}
