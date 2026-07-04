import { NextRequest, NextResponse } from 'next/server';
import { calculateDistance } from '@/lib/maps/googleMaps';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const originLat = parseFloat(searchParams.get('originLat') || '');
    const originLng = parseFloat(searchParams.get('originLng') || '');
    const destLat = parseFloat(searchParams.get('destLat') || '');
    const destLng = parseFloat(searchParams.get('destLng') || '');

    if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
      return NextResponse.json({ error: 'Valid coordinates required' }, { status: 400 });
    }

    const distanceKm = await calculateDistance(
      { lat: originLat, lng: originLng },
      { lat: destLat, lng: destLng }
    );

    return NextResponse.json({ distanceKm });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
