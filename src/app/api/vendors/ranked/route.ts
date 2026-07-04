import { NextRequest, NextResponse } from 'next/server';
import { getRankedVendors } from '@/lib/intelligence/ranking';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const category = searchParams.get('category') || undefined;
  const radius = parseFloat(searchParams.get('radius') || '50');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Location coordinates required' }, { status: 400 });
  }

  try {
    const rankedVendors = await getRankedVendors(lat, lng, category, radius);
    return NextResponse.json(rankedVendors);
  } catch {
    return NextResponse.json({ error: 'Ranking failed' }, { status: 500 });
  }
}
