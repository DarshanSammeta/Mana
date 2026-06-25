import { prisma } from '@/lib/prisma';
import { getRankedVendors } from './ranking';

export const autoAssignVendor = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      bookingitem: {
        include: {
          service: {
            include: {
              servicetype: {
                include: {
                  subcategory: {
                    include: {
                      category: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!booking || !booking.latitude || !booking.longitude) {
    throw new Error('Booking not found or location missing');
  }

  // Use the first service's category for matching
  const categoryName = (booking as any).bookingitem[0]?.service.servicetype.subcategory.category.name;

  const rankedVendors = await getRankedVendors(
    booking.latitude,
    booking.longitude,
    categoryName
  );

  if (rankedVendors.length === 0) {
    console.log(`No vendors found for booking ${bookingId}`);
    return null;
  }

  // Create assignments for top 3 candidates (priority 1, 2, 3)
  const topCandidates = rankedVendors.slice(0, 3);

  const assignments = await Promise.all(
    topCandidates.map((vendor, index) =>
      prisma.bookingassignment.create({
        data: {
          id: crypto.randomUUID(),
          bookingId: bookingId,
          vendorId: vendor!.id,
          priority: index + 1,
          status: index === 0 ? 'PENDING' : 'REASSIGNED', // Start with first vendor
          updatedAt: new Date()
        }
      })
    )
  );

  // Update booking with the best vendor
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      vendorId: topCandidates[0]!.id,
      status: 'VENDOR_ASSIGNED'
    }
  });

  return assignments[0];
};

export const handleVendorRejection = async (bookingId: string, rejectedVendorId: string) => {
  // Update current assignment status
  await prisma.bookingassignment.update({
    where: {
      bookingId_vendorId: {
        bookingId,
        vendorId: rejectedVendorId
      }
    },
    data: { status: 'REJECTED', updatedAt: new Date() }
  });

  // Find next best vendor from pre-calculated assignments
  const nextAssignment = await prisma.bookingassignment.findFirst({
    where: {
      bookingId,
      status: 'REASSIGNED'
    },
    orderBy: { priority: 'asc' }
  });

  if (nextAssignment) {
    await prisma.bookingassignment.update({
      where: { id: nextAssignment.id },
      data: { status: 'PENDING', updatedAt: new Date() }
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        vendorId: nextAssignment.vendorId,
        status: 'VENDOR_ASSIGNED'
      }
    });

    return nextAssignment;
  } else {
    // No more pre-assigned vendors, maybe trigger a new search or notify admin
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'PENDING' } // Revert to pending
    });
    return null;
  }
};
