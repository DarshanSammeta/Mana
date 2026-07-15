import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const recentlyViewed = await prisma.recently_viewed.findMany({
      where: { userId: session.user.id },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            rating: true,
            city: true,
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 12
    });

    return NextResponse.json(recentlyViewed);
  } catch {
    return NextResponse.json({ error: "Failed to fetch recently viewed" }, { status: 500 });
  }
}
