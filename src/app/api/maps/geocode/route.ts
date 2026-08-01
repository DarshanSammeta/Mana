import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/maps/googleMaps';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    const coords = await geocodeAddress(address);
    if (!coords) {
      return NextResponse.json({ error: 'Geocoding failed' }, { status: 404 });
    }

    return NextResponse.json(coords);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
