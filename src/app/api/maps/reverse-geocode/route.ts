import { NextRequest, NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/maps/googleMaps';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Valid lat and lng required' }, { status: 400 });
    }

    const data = await reverseGeocode(lat, lng);
    if (!data) {
      return NextResponse.json({ error: 'Reverse geocoding failed' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
