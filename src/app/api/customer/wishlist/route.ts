import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { WishlistService } from "@/services/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const wishlist = await WishlistService.getWishlist(session.user.id);
    return NextResponse.json(wishlist);
  } catch {
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { type, targetId } = await req.json();
    const result = await WishlistService.toggleItem(session.user.id, type, targetId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
  }
}
