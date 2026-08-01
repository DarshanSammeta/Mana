import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runAudit() {
  console.log("=== Mana Event DB Integrity Audit ===\n");

  // 1. Orphan Portfolio Records
  const orphansPortfolio = await (prisma as any).portfolio.count({
    where: {
      vendorProfileId: { not: { in: (await prisma.vendorprofile.findMany({ select: { id: true } })).map(v => v.id) } }
    }
  });
  console.log(`- Orphan Portfolio Items: ${orphansPortfolio}`);

  // 2. Orphan Booking Items
  const orphansBookingItems = await (prisma as any).bookingitem.count({
    where: {
      bookingId: { not: { in: (await prisma.booking.findMany({ select: { id: true } })).map(b => b.id) } }
    }
  });
  console.log(`- Orphan Booking Items: ${orphansBookingItems}`);

  // 3. Missing Profiles for Users
  const customerUsers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: { customerprofile: true }
  });
  const missingCustomerProfiles = customerUsers.filter(u => !u.customerprofile).length;
  console.log(`- Customers missing profile: ${missingCustomerProfiles}`);

  const vendorUsers = await prisma.user.findMany({
    where: { role: "VENDOR" },
    include: { vendorprofile: true }
  });
  const missingVendorProfiles = vendorUsers.filter(u => !u.vendorprofile).length;
  console.log(`- Vendors missing profile: ${missingVendorProfiles}`);

  // 4. Duplicate Business Names
  const duplicateVendors = await (prisma as any).vendorprofile.groupBy({
    by: ['businessName'],
    _count: {
      businessName: true
    },
    having: {
      businessName: {
        _count: {
          gt: 1
        }
      }
    }
  });
  console.log(`- Duplicate Business Names: ${duplicateVendors.length}`);

  // 5. Payout Discrepancies (Example: Reference duplicates)
  const duplicatePayouts = await (prisma as any).vendor_payout.groupBy({
    by: ['reference'],
    _count: {
      reference: true
    },
    having: {
      reference: {
        _count: {
          gt: 1
        }
      }
    }
  });
  console.log(`- Duplicate Payout References: ${duplicatePayouts.length}`);

  console.log("\n=== Audit Complete ===");
}

runAudit()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
