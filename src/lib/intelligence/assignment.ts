import { prisma } from '@/lib/prisma';
import { getRankedVendors } from './ranking';
import logger from '@/lib/logger';

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
  const categoryName = booking.bookingitem[0]?.service.servicetype.subcategory.category.name;

  const rankedVendors = await getRankedVendors(
    booking.latitude,
    booking.longitude,
    categoryName
  );

  if (rankedVendors.length === 0) {
    logger.info(`No vendors found for booking ${bookingId}`);
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
  // 1. Update current assignment status
  await prisma.bookingassignment.update({
    where: {
      bookingId_vendorId: {
        bookingId,
        vendorId: rejectedVendorId
      }
    },
    data: { status: 'REJECTED', updatedAt: new Date() }
  });

  const rejectedVendor = await prisma.vendorprofile.findUnique({
    where: { id: rejectedVendorId },
    select: { businessName: true }
  });

  // 2. Add Timeline Entry
  await prisma.booking_timeline.create({
    data: {
      id: crypto.randomUUID(),
      bookingId,
      title: "Assignment Rejected",
      description: `Vendor ${rejectedVendor?.businessName || 'Assigned vendor'} declined the request. Finding alternative...`,
      icon: "XCircle",
      color: "rose",
      performedBy: rejectedVendor?.businessName || "Vendor",
      role: "VENDOR"
    }
  });

  // 3. Find next best vendor from pre-calculated assignments
  const nextAssignment = await prisma.bookingassignment.findFirst({
    where: {
      bookingId,
      status: 'REASSIGNED'
    },
    orderBy: { priority: 'asc' }
  });

  if (nextAssignment) {
    // 4. Activate next assignment
    await prisma.bookingassignment.update({
      where: { id: nextAssignment.id },
      data: { status: 'PENDING', updatedAt: new Date() }
    });

    // 5. Update booking current vendor
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        vendorId: nextAssignment.vendorId,
        status: 'PENDING_VENDOR_RESPONSE' // Ensure status is correct for dashboard
      }
    });

    const nextVendor = await prisma.vendorprofile.findUnique({
        where: { id: nextAssignment.vendorId },
        include: { user: true }
    });

    // 6. Notify next vendor
    if (nextVendor) {
        await prisma.notification.create({
            data: {
                id: crypto.randomUUID(),
                userId: nextVendor.userId,
                title: "New Priority Booking!",
                message: "A matching booking request has been reassigned to you. Act now!",
                category: "BOOKING",
                priority: "HIGH",
                link: "/vendor/bookings"
            }
        });

        // Emit Socket Event (Helper if available, else manual)
        try {
            const { emitSocketEvent } = await import("@/lib/socket-helper");
            emitSocketEvent(nextVendor.userId, "NEW_ASSIGNMENT", { bookingId });
        } catch (e) { logger.error("Socket emit failed", e); }
    }

    // 7. Timeline Entry for Reassignment
    await prisma.booking_timeline.create({
        data: {
          id: crypto.randomUUID(),
          bookingId,
          title: "Booking Reassigned",
          description: `Search expanded. Request sent to ${nextVendor?.businessName || 'next eligible vendor'}.`,
          icon: "RefreshCw",
          color: "blue",
          role: "SYSTEM"
        }
    });

    return nextAssignment;
  } else {
    // 8. No more pre-assigned vendors, notify admin or revert to general search
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'PENDING',
        vendorId: null // Clear direct vendor if none left in queue
      }
    });

    logger.warn(`No more candidates found for booking ${bookingId}`);
    return null;
  }
};

/**
 * Handles vendor response timeout (SLA expiry).
 */
export const handleVendorTimeout = async (bookingId: string, vendorId: string) => {
    // 1. Update assignment to EXPIRED
    await prisma.bookingassignment.update({
        where: {
            bookingId_vendorId: {
                bookingId,
                vendorId
            }
        },
        data: { status: 'EXPIRED', updatedAt: new Date() }
    });

    // 2. Reassign to next best candidate
    return await handleVendorRejection(bookingId, vendorId);
};

/**
 * Reassigns a booking to the next best available vendor.
 * Used for manual reassignments or when pre-calculated queue is exhausted.
 */
export const reassignVendor = async (bookingId: string) => {
    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            bookingassignment: true,
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

    if (!booking || !booking.latitude || !booking.longitude) return null;

    const previousIds = booking.bookingassignment.map(a => a.vendorId);
    const categoryName = booking.bookingitem[0]?.service.servicetype.subcategory.category.name;

    const rankedVendors = await getRankedVendors(
        booking.latitude,
        booking.longitude,
        categoryName
    );

    const nextVendor = rankedVendors.find(v => !previousIds.includes(v.id));

    if (nextVendor) {
        const priority = previousIds.length + 1;
        const assignment = await prisma.bookingassignment.create({
            data: {
                id: crypto.randomUUID(),
                bookingId,
                vendorId: nextVendor.id,
                priority,
                status: 'PENDING',
                updatedAt: new Date()
            }
        });

        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                vendorId: nextVendor.id,
                status: 'PENDING_VENDOR_RESPONSE'
            }
        });

        // Notify
        await prisma.notification.create({
            data: {
                id: crypto.randomUUID(),
                userId: nextVendor.userId,
                title: "New Booking Request",
                message: "A new booking matching your profile is available.",
                category: "BOOKING",
                link: "/vendor/bookings"
            }
        });

        return assignment;
    }

    return null;
};
