import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- DATABASE INTEGRITY AUDIT ---");

  try {
    // 1. Check User -> CustomerProfile -> Booking
    const customerProfile = await prisma.customerprofile.findFirst({
        include: { user: true, booking: { take: 1 } }
    });

    if (customerProfile) {
        console.log("✅ CustomerProfile Relation: OK");
        if (customerProfile.booking.length > 0) {
            const b = customerProfile.booking[0];
            // Check if we can find the booking via customerProfile
            const b2 = await prisma.booking.findUnique({
                where: { id: b.id },
                include: { customerprofile: { include: { user: true } } }
            });
            if (b2?.customerprofile.user) {
                console.log("✅ Booking -> CustomerProfile -> User: OK");
            } else {
                console.error("❌ Booking -> CustomerProfile -> User: FAILED");
            }
        }
    } else {
        console.warn("⚠️ No CustomerProfile found to test.");
    }

    // 2. Check User -> VendorProfile -> Booking
    const vendorProfile = await prisma.vendorprofile.findFirst({
        include: { user: true, booking: { take: 1 } }
    });

    if (vendorProfile) {
        console.log("✅ VendorProfile Relation: OK");
        if (vendorProfile.booking.length > 0) {
            const b = vendorProfile.booking[0];
            const b2 = await prisma.booking.findUnique({
                where: { id: b.id },
                include: { vendorprofile: { include: { user: true } } }
            });
            if (b2?.vendorprofile?.user) {
                console.log("✅ Booking -> VendorProfile -> User: OK");
            } else {
                console.error("❌ Booking -> VendorProfile -> User: FAILED");
            }
        }
    } else {
        console.warn("⚠️ No VendorProfile found to test.");
    }

    // 3. Check for legacy fields (ensuring they don't break queries if they exist but shouldn't)
    // Actually Prisma wouldn't allow them in queries if they aren't in schema.

    // 4. Verify CounterQuote relation
    const hasCounterQuoteModel = (prisma as any).counterquote !== undefined;
    console.log(`Model CounterQuote exists in Client: ${hasCounterQuoteModel ? 'YES' : 'NO'}`);

  } catch (e: any) {
    console.error("❌ Audit Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
