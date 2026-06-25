import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventType = searchParams.get('eventType');
  const city = searchParams.get('city');

  try {
    // 1. "Top Rated"
    const topRated = await prisma.vendorprofile.findMany({
      where: { verificationStatus: 'APPROVED' },
      orderBy: { rating: 'desc' },
      take: 4,
      include: { user: { select: { fullName: true } } }
    });

    // 2. "Near You" (Simplified to city-based if no lat/lng)
    const nearYou = city ? await prisma.vendorprofile.findMany({
      where: { city, verificationStatus: 'APPROVED' },
      orderBy: { totalBookings: 'desc' },
      take: 4,
      include: { user: { select: { fullName: true } } }
    }) : [];

    // 3. "Best Value" (Based on bookings and rating balance)
    const bestValue = await prisma.vendorprofile.findMany({
      where: { verificationStatus: 'APPROVED' },
      orderBy: [
        { totalBookings: 'desc' },
        { rating: 'desc' }
      ],
      take: 4,
      include: { user: { select: { fullName: true } } }
    });

    return NextResponse.json({
      topRated,
      nearYou,
      bestValue
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}
