import {
  PrismaClient,
  Prisma,
  user_role,
  booking_status,
  payment_status,
  vendorprofile_verificationStatus,
  review_moderationStatus,
  notification_category,
  notification_priority,
  wallet_type,
  vendorsubscription_status
} from "@prisma/client";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// --- CONFIGURATION ---
const TARGET_VENDORS = 300;
const TARGET_CUSTOMERS = 400;
const TARGET_BOOKINGS = 1200;
const SERVICES_PER_VENDOR = { min: 10, max: 20 };
const BATCH_SIZE = 500;

// --- DATA POOLS ---
const CITIES = [
  { name: "Hyderabad", state: "Telangana" },
  { name: "Mumbai", state: "Maharashtra" },
  { name: "Delhi", state: "Delhi" },
  { name: "Bangalore", state: "Karnataka" },
  { name: "Chennai", state: "Tamil Nadu" },
  { name: "Kolkata", state: "West Bengal" },
  { name: "Pune", state: "Maharashtra" },
  { name: "Ahmedabad", state: "Gujarat" },
  { name: "Jaipur", state: "Rajasthan" },
  { name: "Lucknow", state: "Uttar Pradesh" }
];

const UNSPLASH_IDS = [
  "1511795409834-ef04bbd61622", "1519167758481-83f550bb49b3", "1452587925148-ce544e77e70d",
  "1555244162-803834f70033", "1470225620780-dba8ba36b745", "1519741497674-611481863552",
  "1469334031218-e382a71b716b", "1533174072545-7a4b6ad7a6c3", "1520853502310-59f03044955a",
  "1511578314322-379afb476865", "1530103043960-ef38714abb15", "1492684223066-81342ee5ff30",
  "1504674900247-0877df9cc836", "1414235077428-338989a2e8c0", "1516035069371-29a1b244cc32",
  "1502635394472-3580579e0004", "1507502707371-f923ff73d937", "1519225421980-715cb0215aed",
  "1510076857179-b3d105c2d401", "1519671482749-fd09be71ca9d", "1527529482722-df07c52a0a2a",
  "1531058022588-3ad05574c87a", "1484863137850-59afdba05c97", "1496337589254-7e19d01ced44",
  "1520116468124-83e8cf4b4fb5", "1523585422666-54558525412b", "1501281668908-78a996d7f10b",
  "1441986300917-64674bd600d8", "1515934751635-c81c6bc9a2d8", "1515169067868-5387ec3567a4",
  "1511578314322-379afb476865", "1519741497674-611481863552", "1505232458627-629c4666f941",
  "1464366400600-7168b8af9bc3", "1472653431148-60a17f859716", "1510519133411-cdd9f8ad9a3b",
  "1519167758481-83f550bb49b3", "1519225421980-715cb0215aed", "1486415737603-eedef84c7aa5",
  "1470225620780-dba8ba36b745", "1506157786487-3eef7457c02c", "1530103043960-ef38714abb15",
  "1522158674163-35f1fa448748", "1524777496754-0a3a2e0c53b1", "1513151233558-c86f773211c8",
  "1492684223066-81342ee5ff30", "1501281668908-78a996d7f10b", "1478147427435-0558a369e50d"
];

const getUnsplashUrl = (id: string, w = 800, h = 600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}&h=${h}`;

const MARKETPLACE_STRUCTURE = {
  categories: [
    {
      name: "Venue",
      subcategories: [
        { name: "Banquet Halls", serviceTypes: ["AC Hall", "Non AC Hall", "Luxury Banquet Hall"] },
        { name: "Resorts", serviceTypes: ["Boutique Resort", "Luxury Resort"] },
        { name: "Hotels", serviceTypes: ["3 Star Hotel", "5 Star Hotel"] }
      ]
    },
    {
      name: "Catering",
      subcategories: [
        { name: "Catering Services", serviceTypes: ["Veg Catering", "Non Veg Catering", "Multi Cuisine", "Buffet", "Live Counter"] }
      ]
    },
    {
      name: "Photography",
      subcategories: [
        { name: "Photography Services", serviceTypes: ["Wedding Photography", "Candid Photography", "Pre Wedding Shoot", "Drone Photography"] }
      ]
    },
    {
      name: "Decoration",
      subcategories: [
        { name: "Decoration Services", serviceTypes: ["Stage Decoration", "Floral Decoration", "Lighting", "Mandap Decoration"] }
      ]
    }
  ]
};

const VENDOR_TYPES_CONFIG = [
  { name: "Caterer", suffix: "Caterers", category: "Catering", services: ["Veg Catering", "Non Veg Catering", "Multi Cuisine", "Buffet", "Live Counter"] },
  { name: "Photographer", suffix: "Studios", category: "Photography", services: ["Wedding Photography", "Candid Photography", "Pre Wedding Shoot", "Drone Photography"] },
  { name: "Decorator", suffix: "Decors", category: "Decoration", services: ["Stage Decoration", "Floral Decoration", "Lighting", "Mandap Decoration"] },
  { name: "Banquet Hall", suffix: "Banquets", category: "Venue", services: ["AC Hall", "Non AC Hall", "Luxury Banquet Hall"] },
  { name: "Resort", suffix: "Resorts", category: "Venue", services: ["Boutique Resort", "Luxury Resort"] },
  { name: "Hotel", suffix: "Hotels", category: "Venue", services: ["3 Star Hotel", "5 Star Hotel"] }
];

const PACKAGE_TIERS = ["Basic", "Standard", "Premium", "Deluxe", "Luxury", "Royal", "Elite"];

// --- HELPERS ---
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

// --- CORE LOGIC ---
async function main() {
  const startTime = Date.now();
  console.log("🧹 Wiping old data...");

  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.warn("⚠️ Truncate failed, falling back to deleteMany...", error);
    // Fallback if truncate fails
    await prisma.audit_log.deleteMany();
    await prisma.booking_timeline.deleteMany();
    await prisma.payment_split.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.review.deleteMany();
    await prisma.portfolio.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.recurringavailability.deleteMany();
    await prisma.vendordocument.deleteMany();
    await prisma.vendorteam.deleteMany();
    await prisma.booking_team_assignment.deleteMany();
    await prisma.vendor_team_member.deleteMany();
    await prisma.vendor_team.deleteMany();
    await prisma.booking_addon.deleteMany();
    await prisma.booking_checklist.deleteMany();
    await prisma.booking_document.deleteMany();
    await prisma.bookingitem.deleteMany();
    await prisma.dispute.deleteMany();
    await prisma.eventcheckin.deleteMany();
    await prisma.staff.deleteMany();
    await prisma.cancellation_record.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.pricingrule.deleteMany();
    await prisma.package_addon.deleteMany();
    await prisma.renamedpackage.deleteMany();
    await prisma.service.deleteMany();
    await prisma.vendorsubscription.deleteMany();
    await prisma.subscriptionpayment.deleteMany();
    await prisma.subscriptionplan.deleteMany();
    await prisma.vendorprofile.deleteMany();
    await prisma.customerprofile.deleteMany();
    await prisma.refreshtoken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.servicetype.deleteMany();
    await prisma.subcategory.deleteMany();
    await prisma.category.deleteMany();
    await prisma.eventtype.deleteMany();
  }

  const hashedPass = await bcrypt.hash("Mana@123", 10);

  // --- Step 1: Create User Identities ---
  console.log("👤 Step 1: Seeding User Identities...");

  // Admin
  const adminId = randomUUID();
  await prisma.user.create({
    data: {
      id: adminId,
      email: "admin@manaevents.com",
      password: hashedPass,
      fullName: "System Admin",
      mobileNumber: "9999999999",
      role: user_role.ADMIN,
      isEmailVerified: true
    }
  });

  // Vendor Users
  const vendorUsersToCreate: any[] = [];
  const vendorUserIds: string[] = [];
  for (let i = 1; i <= TARGET_VENDORS; i++) {
    const vId = randomUUID();
    vendorUsersToCreate.push({
      id: vId,
      email: `vendor${i}@example.com`,
      password: hashedPass,
      fullName: `Vendor Owner ${i}`,
      mobileNumber: `88888${i.toString().padStart(5, '0')}`,
      role: user_role.VENDOR,
      isEmailVerified: true
    });
    vendorUserIds.push(vId);
  }

  // Customer Users
  const customerUsersToCreate: any[] = [];
  const customerUserIds: string[] = [];
  for (let i = 1; i <= TARGET_CUSTOMERS; i++) {
    const cId = randomUUID();
    customerUsersToCreate.push({
      id: cId,
      email: `customer${i}@example.com`,
      password: hashedPass,
      fullName: `Customer Name ${i}`,
      mobileNumber: `77777${i.toString().padStart(5, '0')}`,
      role: user_role.CUSTOMER,
      isEmailVerified: true
    });
    customerUserIds.push(cId);
  }

  await prisma.user.createMany({ data: [...vendorUsersToCreate, ...customerUsersToCreate] });

  // --- Step 2: Create Customer Profiles ---
  console.log("💎 Step 2: Seeding Customer Profiles...");
  const customerProfilesToCreate: any[] = [];
  for (const cId of customerUserIds) {
    customerProfilesToCreate.push({
      id: randomUUID(),
      userId: cId,
      loyaltyPoints: getRandomInt(100, 5000),
      referralCode: `REF-${randomUUID().substring(0, 8).toUpperCase()}`,
      interests: ["Wedding", "Birthday"],
      updatedAt: new Date()
    });
  }
  await prisma.customerprofile.createMany({ data: customerProfilesToCreate });
  const cpMap = new Map(customerProfilesToCreate.map(cp => [cp.userId, cp.id]));

  // --- Step 3: Create Vendor Profiles ---
  console.log("🏬 Step 3: Seeding Vendor Profiles...");

  console.log("🎭 Seeding Event Types & Hierarchy...");
  const EVENT_TYPES = ["Wedding", "Engagement", "Reception", "Birthday Party", "Corporate Event", "Baby Shower", "House Warming"];
  const etData = EVENT_TYPES.map(name => ({
    id: randomUUID(), name, description: `Premium ${name} services.`,
    image: getUnsplashUrl(getRandom(UNSPLASH_IDS)),
    icon: "https://cdn-icons-png.flaticon.com/512/1043/1043444.png", isActive: true
  }));
  await prisma.eventtype.createMany({ data: etData });
  const etMap = new Map(etData.map(et => [et.name, et.id]));

  const catData: any[] = [];
  const subCatData: any[] = [];
  const stData: any[] = [];
  const categoryIdsByName = new Map<string, string>();
  const serviceTypeIdsByName = new Map<string, string>();

  for (const etName of EVENT_TYPES) {
    const etId = etMap.get(etName)!;
    for (const cat of MARKETPLACE_STRUCTURE.categories) {
      const cId = randomUUID();
      catData.push({ id: cId, name: cat.name, eventTypeId: etId, commissionRate: 10.00, image: getUnsplashUrl(getRandom(UNSPLASH_IDS)), icon: "https://cdn-icons-png.flaticon.com/512/1157/1157949.png" });
      categoryIdsByName.set(`${etName}:${cat.name}`, cId);

      for (const sub of cat.subcategories) {
        const sId = randomUUID();
        subCatData.push({ id: sId, name: sub.name, categoryId: cId });
        for (const stName of sub.serviceTypes) {
          const stId = randomUUID();
          stData.push({ id: stId, name: stName, subcategoryId: sId, description: `${stName} services for your ${etName}.` });
          serviceTypeIdsByName.set(`${etName}:${stName}`, stId);
        }
      }
    }
  }
  await prisma.category.createMany({ data: catData });
  await prisma.subcategory.createMany({ data: subCatData });
  await prisma.servicetype.createMany({ data: stData });

  console.log("💎 Seeding Subscription Plans...");
  const planId = randomUUID();
  await prisma.subscriptionplan.create({
    data: { id: planId, name: "Premium Enterprise", price: 9999, durationMonths: 12, listingLimit: 100, features: { analytics: true, priority: true }, updatedAt: new Date() }
  });

  const vendorProfilesToCreate: any[] = [];
  const vendorSubsToCreate: any[] = [];
  const portfoliosToCreate: any[] = [];
  const vendorCategoryTracking: Map<string, string> = new Map();

  for (let i = 0; i < vendorUserIds.length; i++) {
    const vId = vendorUserIds[i];
    const vpId = randomUUID();
    const city = getRandom(CITIES);
    const vendorConfig = getRandom(VENDOR_TYPES_CONFIG);
    vendorCategoryTracking.set(vpId, vendorConfig.name);

    const firstEventType = EVENT_TYPES[0];
    const catId = categoryIdsByName.get(`${firstEventType}:${vendorConfig.category}`);

    vendorProfilesToCreate.push({
      id: vpId, userId: vId, businessName: `Mana ${getRandom(["Elite", "Royal", "Premium", "Golden"])} ${vendorConfig.suffix} ${i+1}`,
      city: city.name, state: city.state, gstNumber: `29ABCDE${getRandomInt(1000, 9999)}F1Z5`, verificationStatus: vendorprofile_verificationStatus.APPROVED, experienceYears: getRandomInt(2, 15),
      logo: getUnsplashUrl(getRandom(UNSPLASH_IDS), 200, 200), coverImage: getUnsplashUrl(getRandom(UNSPLASH_IDS), 1200, 400),
      bankDetails: { accountName: `Mana Ventures ${i+1}`, accountNumber: `50100${getRandomInt(1000000, 9999999)}`, ifsc: "HDFC0001234", bankName: "HDFC Bank" }, isActive: true,
      categoryId: catId, updatedAt: new Date()
    });
    vendorSubsToCreate.push({ id: randomUUID(), vendorProfileId: vpId, planId, startDate: new Date(), endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), status: vendorsubscription_status.ACTIVE, updatedAt: new Date() });
    for (let j = 0; j < 5; j++) {
       portfoliosToCreate.push({ id: randomUUID(), vendorProfileId: vpId, mediaUrl: getUnsplashUrl(getRandom(UNSPLASH_IDS)), mediaType: "IMAGE", title: "Project Work " + j });
    }
  }
  await prisma.vendorprofile.createMany({ data: vendorProfilesToCreate });
  await prisma.vendorsubscription.createMany({ data: vendorSubsToCreate });
  await prisma.portfolio.createMany({ data: portfoliosToCreate });

  // --- Step 4: Create Marketplace Data ---
  console.log("📦 Step 4: Seeding Marketplace Data (Services, Bookings, Reviews)...");
  const servicesToCreate: any[] = [];
  const packagesToCreate: any[] = [];
  const pricingRulesToCreate: any[] = [];

  for (const v of vendorProfilesToCreate) {
    const vendorTypeName = vendorCategoryTracking.get(v.id)!;
    const vendorConfig = VENDOR_TYPES_CONFIG.find(c => c.name === vendorTypeName)!;

    const validSTIds: string[] = [];
    for (const etName of EVENT_TYPES) {
      for (const stName of vendorConfig.services) {
        const id = serviceTypeIdsByName.get(`${etName}:${stName}`);
        if (id) validSTIds.push(id);
      }
    }

    if (validSTIds.length === 0) continue;

    const svcCount = Math.min(validSTIds.length, getRandomInt(SERVICES_PER_VENDOR.min, SERVICES_PER_VENDOR.max));
    const shuffled = validSTIds.sort(() => 0.5 - Math.random());
    const selectedSTs = shuffled.slice(0, svcCount);

    selectedSTs.forEach((stId: string) => {
      const sId = randomUUID();
      const basePrice = getRandomInt(10000, 50000);
      servicesToCreate.push({ id: sId, vendorProfileId: v.id, serviceTypeId: stId, title: `Premium Service by ${v.businessName}`, description: "Enterprise-grade service quality.", basePrice, pricingType: "PACKAGE", updatedAt: new Date() });
      PACKAGE_TIERS.forEach((tier, idx) => {
        const pId = randomUUID();
        const pPrice = basePrice * (idx + 1);
        packagesToCreate.push({ id: pId, serviceId: sId, name: tier, description: `${tier} package deliverables.`, price: pPrice, inclusions: ["Verified Team"], exclusions: ["Travel"], images: [getUnsplashUrl(getRandom(UNSPLASH_IDS))] });
        const slabs = [{ min: 1, max: 100, ppg: 0, flat: 0 }, { min: 101, max: 500, ppg: pPrice * 0.02, flat: 0 }, { min: 501, max: 1000, ppg: pPrice * 0.015, flat: pPrice * 0.05 }, { min: 1001, max: 5000, ppg: pPrice * 0.01, flat: pPrice * 0.1 }];
        slabs.forEach(s => { pricingRulesToCreate.push({ id: randomUUID(), packageId: pId, minGuests: s.min, maxGuests: s.max, pricePerGuest: s.ppg, flatFee: s.flat }); });
      });
    });
    if (servicesToCreate.length >= BATCH_SIZE) {
      await prisma.service.createMany({ data: servicesToCreate });
      await prisma.renamedpackage.createMany({ data: packagesToCreate });
      await prisma.pricingrule.createMany({ data: pricingRulesToCreate });
      servicesToCreate.length = 0; packagesToCreate.length = 0; pricingRulesToCreate.length = 0;
    }
  }
  if (servicesToCreate.length > 0) {
    await prisma.service.createMany({ data: servicesToCreate });
    await prisma.renamedpackage.createMany({ data: packagesToCreate });
    await prisma.pricingrule.createMany({ data: pricingRulesToCreate });
  }

  // Wallets
  console.log("💳 Seeding Wallets...");
  const allUsers = await prisma.user.findMany({ select: { id: true, role: true } });
  await prisma.wallet.createMany({ data: allUsers.map(u => ({ id: randomUUID(), userId: u.id, balance: 5000, type: u.role === "VENDOR" ? wallet_type.VENDOR : wallet_type.USER })) });
  await prisma.wallet.createMany({ data: ["PLATFORM", "ESCROW", "COMMISSION"].map(t => ({ id: randomUUID(), type: t as wallet_type, balance: 0 })) });

  // Bookings
  console.log("📈 Seeding 1200 Bookings...");
  const bookingsToCreate: any[] = [];
  const paymentsToCreate: any[] = [];
  const splitsToCreate: any[] = [];
  const invoicesToCreate: any[] = [];
  const timelineToCreate: any[] = [];

  for (let i = 0; i < TARGET_BOOKINGS; i++) {
    const bId = randomUUID();
    const vendor = getRandom(vendorProfilesToCreate);
    const customerUserId = getRandom(customerUserIds);
    const customerProfileId = cpMap.get(customerUserId)!;
    const isCompleted = Math.random() < 0.85;
    const status = isCompleted ? "EVENT_COMPLETED" : "PENDING";
    const amount = getRandomInt(30000, 150000);
    const createdAt = new Date(Date.now() - getRandomInt(1, 365) * 24 * 60 * 60 * 1000);
    const subTotal = amount / (1.05 * 1.18);
    const platformFee = subTotal * 0.05;
    const taxAmount = (subTotal + platformFee) * 0.18;

    bookingsToCreate.push({
      id: bId,
      bookingNumber: `BK-2026-${randomUUID().substring(0, 8).toUpperCase()}`,
      customerProfileId,
      vendorId: vendor.id,
      status,
      totalAmount: amount,
      subTotal,
      taxAmount,
      commissionAmount: platformFee,
      eventDate: new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 30),
      eventLocation: "Sector " + getRandomInt(1, 20) + ", " + vendor.city,
      city: vendor.city,
      state: vendor.state,
      guestCount: getRandomInt(50, 500),
      createdAt,
      updatedAt: createdAt
    });

    if (status === "EVENT_COMPLETED") {
      const pId = randomUUID();
      paymentsToCreate.push({ id: pId, bookingId: bId, amount, status: "SUCCESS", paymentType: "FULL", method: "RAZORPAY", razorpayPaymentId: `pay_${randomUUID().replace(/-/g, '').substring(0, 14)}`, createdAt, updatedAt: createdAt });
      splitsToCreate.push({ id: randomUUID(), paymentId: pId, bookingId: bId, vendorId: vendor.id, customerProfileId, totalAmount: amount, adminShare: (subTotal * 0.1) + platformFee, vendorShare: subTotal - (subTotal * 0.1), commissionRate: 10.00, status: "COMPLETED", createdAt, updatedAt: new Date() });
      invoicesToCreate.push({ id: randomUUID(), bookingId: bId, invoiceNumber: `INV-2026-${randomUUID().substring(0, 6).toUpperCase()}`, subTotal, taxAmount, totalAmount: amount, createdAt });
      timelineToCreate.push({ id: randomUUID(), bookingId: bId, title: "Booking Finalized", description: "All payments and logs processed.", createdAt });
    }

    if (bookingsToCreate.length >= BATCH_SIZE) {
      await prisma.booking.createMany({ data: bookingsToCreate });
      await prisma.payment.createMany({ data: paymentsToCreate });
      await prisma.payment_split.createMany({ data: splitsToCreate });
      await prisma.invoice.createMany({ data: invoicesToCreate });
      await prisma.booking_timeline.createMany({ data: timelineToCreate });
      bookingsToCreate.length = 0; paymentsToCreate.length = 0; splitsToCreate.length = 0; invoicesToCreate.length = 0; timelineToCreate.length = 0;
    }
  }
  if (bookingsToCreate.length > 0) {
    await prisma.booking.createMany({ data: bookingsToCreate });
    await prisma.payment.createMany({ data: paymentsToCreate });
    await prisma.payment_split.createMany({ data: splitsToCreate });
    await prisma.invoice.createMany({ data: invoicesToCreate });
    await prisma.booking_timeline.createMany({ data: timelineToCreate });
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n✅ Enterprise Seed completed in ${duration}s`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
