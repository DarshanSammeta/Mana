import { PrismaClient, booking_status } from "@prisma/client";

const prisma = new PrismaClient();

async function runAudit() {
  console.log("====================================================");
  console.log("      ENTERPRISE VERIFICATION & INTEGRITY AUDIT     ");
  console.log("====================================================");

  const results: any = {
    integrity: {},
    orphans: {},
    duplicates: {},
    vendors: {},
    images: {},
    performance: {},
  };

  // --- PHASE 1: DATABASE INTEGRITY ---
  console.log("\n[PHASE 1] Checking Database Hierarchy...");

  const eventTypes = await prisma.eventtype.findMany({ include: { categories: true } });
  results.integrity.eventTypesWithoutCategories = eventTypes.filter(et => et.categories.length === 0).map(et => et.name);

  const categories = await prisma.category.findMany({ include: { subcategory: true } });
  results.integrity.categoriesWithoutSubcats = categories.filter(c => c.subcategory.length === 0).map(c => `${c.name} (ET ID: ${c.eventTypeId})`);

  const subcats = await prisma.subcategory.findMany({ include: { servicetype: true } });
  results.integrity.subcatsWithoutServiceTypes = subcats.filter(s => s.servicetype.length === 0).map(s => s.name);

  const serviceTypes = await prisma.servicetype.findMany({ include: { service: true } });
  results.integrity.serviceTypesWithoutServices = serviceTypes.filter(st => st.service.length === 0).map(st => st.name);

  const services = await prisma.service.findMany({ include: { Renamedpackage: true } });
  results.integrity.servicesWithoutPackages = services.filter(s => s.Renamedpackage.length === 0).map(s => s.title);

  const packages = await prisma.renamedpackage.findMany({ include: { package_addon: true, pricingrule: true } });
  results.integrity.packagesWithoutAddons = packages.filter(p => p.package_addon.length === 0).map(p => p.name);
  results.integrity.packagesWithoutPricingRules = packages.filter(p => p.pricingrule.length === 0).map(p => `${p.name} (Pkg ID: ${p.id})`);

  // Analytics depth check
  const bookings = await prisma.booking.findMany({ select: { status: true, totalAmount: true } });
  results.integrity.bookingStatusDistribution = bookings.reduce((acc: any, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  // --- PHASE 2: FOREIGN KEYS & ORPHANS ---
  console.log("[PHASE 2] Checking Orphans & Duplicates...");

  // Duplicates check
  const duplicatePackageNames = await prisma.$queryRaw`
    SELECT "serviceId", name, COUNT(*)
    FROM package
    GROUP BY "serviceId", name
    HAVING COUNT(*) > 1
  `;
  results.duplicates.packageNames = duplicatePackageNames;

  const duplicateCategories = await prisma.$queryRaw`
    SELECT name, "eventTypeId", COUNT(*)
    FROM category
    GROUP BY name, "eventTypeId"
    HAVING COUNT(*) > 1
  `;
  results.duplicates.categories = duplicateCategories;

  // --- PHASE 5: VENDOR DATA ---
  console.log("[PHASE 5] Checking Vendor Completeness...");
  const vendors = await prisma.vendorprofile.findMany({
    include: {
      portfolio: true,
      service: true,
      review: true,
      availability: true,
      vendorsubscription: true,
      user: { include: { wallet: true } },
    }
  });

  results.vendors.incompleteProfiles = vendors.filter(v =>
    !v.bankDetails || !v.gstNumber || v.portfolio.length === 0 || !v.vendorsubscription || v.service.length === 0 || !v.user.wallet
  ).map(v => v.businessName);

  results.vendors.total = vendors.length;
  results.vendors.withGallery = vendors.filter(v => v.portfolio.length > 0).length;
  results.vendors.withBankDetails = vendors.filter(v => v.bankDetails).length;

  // --- PHASE 6: IMAGES ---
  console.log("[PHASE 6] Checking Image Assets...");
  const portfolios = await prisma.portfolio.findMany({ select: { mediaUrl: true } });
  const vendorLogos = await prisma.vendorprofile.findMany({ select: { logo: true, coverImage: true } });
  const eventImages = await prisma.eventtype.findMany({ select: { image: true } });
  const categoryImages = await prisma.category.findMany({ select: { image: true } });
  const packageImages = await prisma.renamedpackage.findMany({ select: { images: true } });

  const allImages = [
    ...portfolios.map(p => p.mediaUrl),
    ...vendorLogos.map(v => v.logo).filter(Boolean),
    ...vendorLogos.map(v => v.coverImage).filter(Boolean),
    ...eventImages.map(e => e.image).filter(Boolean),
    ...categoryImages.map(c => c.image).filter(Boolean),
    ...packageImages.flatMap(p => Array.isArray(p.images) ? p.images : []).filter(Boolean)
  ];

  results.images.total = allImages.length;
  results.images.unique = new Set(allImages).size;
  results.images.placeholders = allImages.filter(img => {
    const s = String(img);
    return s.includes('placeholder') || s.includes('example.com');
  }).length;

  // --- PHASE 9: PERFORMANCE ---
  console.log("[PHASE 9] Checking Table Sizes...");
  const tableCounts = await Promise.all([
    prisma.eventtype.count(),
    prisma.category.count(),
    prisma.subcategory.count(),
    prisma.servicetype.count(),
    prisma.service.count(),
    prisma.renamedpackage.count(),
    prisma.package_addon.count(),
    prisma.booking.count(),
    prisma.payment.count(),
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.payout.count(),
    prisma.invoice.count(),
    prisma.payment_split.count(),
    prisma.wallet.count(),
  ]);

  results.performance.tableCounts = {
    eventTypes: tableCounts[0],
    categories: tableCounts[1],
    subcategories: tableCounts[2],
    serviceTypes: tableCounts[3],
    services: tableCounts[4],
    packages: tableCounts[5],
    addons: tableCounts[6],
    bookings: tableCounts[7],
    payments: tableCounts[8],
    users: tableCounts[9],
    transactions: tableCounts[10],
    payouts: tableCounts[11],
    invoices: tableCounts[12],
    paymentSplits: tableCounts[13],
    wallets: tableCounts[14],
    pricingRules: await prisma.pricingrule.count(),
  };

  console.log("\n================ AUDIT SUMMARY ================");
  console.log(JSON.stringify(results, null, 2));
  console.log("===============================================");
}

runAudit().finally(() => prisma.$disconnect());
