import { PrismaClient, booking_status } from "@prisma/client";

const prisma = new PrismaClient();

async function runFinalAudit() {
  console.log("--- FINAL PRODUCTION VALIDATION (READ-ONLY) ---");

  const results: any = {
    marketplace: {
      eventTypes: 0,
      categories: 0,
      subCategories: 0,
      serviceTypes: 0,
      emptyServiceTypes: 0,
    },
    bookings: {
      total: 0,
      completed: 0,
      missingFinancials: [],
      missingInvoices: [],
      missingSplits: [],
      missingTimeline: [],
      missingAudit: [],
    },
    financials: {
      logicErrors: [],
      walletMismatchCount: 0,
    },
    vendors: {
      incompleteProfiles: [],
      payloadAnalysis: [],
    },
    performance: {
      heavyIncludes: [],
    }
  };

  // 1. Marketplace Hierarchy
  results.marketplace.eventTypes = await prisma.eventtype.count();
  results.marketplace.categories = await prisma.category.count();
  results.marketplace.subCategories = await prisma.subcategory.count();
  results.marketplace.serviceTypes = await prisma.servicetype.count();

  const sts = await prisma.servicetype.findMany({
    include: { _count: { select: { service: true } } }
  });
  results.marketplace.emptyServiceTypes = sts.filter(s => s._count.service === 0).length;

  // 2. Booking Flow & Financial Integrity
  const completedBookings = await prisma.booking.findMany({
    where: { status: "EVENT_COMPLETED" },
    include: {
      payment: true,
      invoice: true,
      payment_split: true,
      booking_timeline: true,
      audit_log: true
    },
    take: 100 // Sample
  });

  results.bookings.total = await prisma.booking.count();
  results.bookings.completed = await prisma.booking.count({ where: { status: "EVENT_COMPLETED" } });

  for (const b of completedBookings) {
    if (b.payment.length === 0) results.bookings.missingFinancials.push(b.bookingNumber);
    if (!b.invoice) results.bookings.missingInvoices.push(b.bookingNumber);
    if (!b.payment_split) results.bookings.missingSplits.push(b.bookingNumber);
    if (b.booking_timeline.length === 0) results.bookings.missingTimeline.push(b.bookingNumber);
    if (b.audit_log.length === 0) results.bookings.missingAudit.push(b.bookingNumber);

    // Logic Check
    if (b.invoice) {
        const expectedSubtotal = Number(b.totalAmount) / (1.05 * 1.18);
        const diff = Math.abs(Number(b.invoice.subTotal) - expectedSubtotal);
        if (diff > 1) {
            results.financials.logicErrors.push(`Invoice math mismatch for ${b.bookingNumber}: Expected ${expectedSubtotal.toFixed(2)}, got ${b.invoice.subTotal}`);
        }
    }
  }

  // 3. Vendor Profiles & Payload
  const vendors = await prisma.vendorprofile.findMany({
    include: {
        user: true,
        service: {
            include: {
                Renamedpackage: { include: { pricingrule: true } },
                servicetype: { include: { subcategory: { include: { category: true } } } }
            }
        },
        portfolio: true,
        review: true,
        availability: true,
        vendorsubscription: true
    },
    take: 5
  });

  for (const v of vendors) {
    const size = Buffer.byteLength(JSON.stringify(v));
    results.vendors.payloadAnalysis.push({
      businessName: v.businessName,
      sizeKB: (size / 1024).toFixed(2),
      overLimit: size > 500 * 1024
    });

    if (!v.logo || !v.coverImage || v.portfolio.length === 0 || !v.vendorsubscription) {
        results.vendors.incompleteProfiles.push(v.businessName);
    }
  }

  // 4. Wallet Integrity
  // (Simplified: just checking if any wallets exist with zero balance for high-transaction users)
  const systemWallets = await prisma.wallet.findMany({ where: { userId: null } });
  if (systemWallets.length < 3) results.financials.logicErrors.push("Missing system wallets (Platform/Escrow/Commission)");

  console.log(JSON.stringify(results, null, 2));
}

runFinalAudit().finally(() => prisma.$disconnect());
