import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/maps/googleMaps';

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
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
