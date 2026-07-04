import { NextRequest, NextResponse } from 'next/server';
import { autoAssignVendor } from '@/lib/intelligence/assignment';
import { withErrorHandler } from '@/lib/error-handler';

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ message: 'Booking ID required' }, { status: 400 });
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
  });
}
