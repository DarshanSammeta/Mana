import { NextRequest, NextResponse } from 'next/server';
import { getAutocompleteSuggestions } from '@/lib/maps/googleMaps';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const input = searchParams.get('input');

    if (!input) {
      return NextResponse.json({ error: 'Input required' }, { status: 400 });
    }

    const suggestions = await getAutocompleteSuggestions(input);
    return NextResponse.json(suggestions);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
