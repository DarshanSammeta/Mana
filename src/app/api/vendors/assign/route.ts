import { NextRequest, NextResponse } from 'next/server';
import { autoAssignVendor } from '@/lib/intelligence/assignment';

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }

    const assignment = await autoAssignVendor(bookingId);

    if (!assignment) {
      return NextResponse.json({
        message: 'No suitable vendor found for auto-assignment. Booking remains pending.',
        status: 'PENDING'
      });
    }

    return NextResponse.json({
      message: 'Vendor assigned successfully',
      assignment
    });
  } catch (error: any) {
    console.error('Auto-assignment error:', error);
    return NextResponse.json({ error: error.message || 'Assignment failed' }, { status: 500 });
  }
}
