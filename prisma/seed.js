const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

const CITIES = [
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
  { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 },
  { name: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.2090 },
  { name: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
];

const EVENT_TYPES = [
  { name: "Wedding", description: "Grand wedding celebrations", icon: "ring" },
  { name: "Birthday Party", description: "Fun birthday parties", icon: "cake" },
  { name: "Corporate Event", description: "Professional business events", icon: "briefcase" },
  { name: "Social Gathering", description: "Casual and formal get-togethers", icon: "users" },
  { name: "Anniversary", description: "Celebrating milestones", icon: "heart" },
];

const CATEGORIES = [
  { name: "Photography", icon: "camera", eventTypes: ["Wedding", "Birthday Party", "Corporate Event", "Social Gathering", "Anniversary"] },
  { name: "Catering", icon: "utensils", eventTypes: ["Wedding", "Birthday Party", "Corporate Event", "Social Gathering", "Anniversary"] },
  { name: "Decoration", icon: "palette", eventTypes: ["Wedding", "Birthday Party", "Social Gathering", "Anniversary"] },
  { name: "DJ & Music", icon: "music", eventTypes: ["Wedding", "Birthday Party", "Corporate Event", "Social Gathering"] },
  { name: "Entertainment", icon: "smile", eventTypes: ["Birthday Party", "Social Gathering", "Corporate Event"] },
  { name: "Cakes", icon: "cake", eventTypes: ["Birthday Party", "Wedding", "Anniversary"] },
  { name: "Transportation", icon: "car", eventTypes: ["Wedding", "Corporate Event"] },
  { name: "Return Gifts", icon: "gift", eventTypes: ["Wedding", "Birthday Party", "Social Gathering"] },
];

const SUB_DATA = {
  "Photography": ["Wedding Photography", "Candid Photography", "Cinematic Photography"],
  "Catering": ["South Indian Catering", "North Indian Catering", "Buffet Catering"],
  "Decoration": ["Stage Decoration", "Floral Decoration", "Balloon Decoration"],
  "DJ & Music": ["DJ Services", "Live Band", "Sound Systems"],
  "Entertainment": ["Magic Show", "Dance Performance", "Anchors"],
  "Cakes": ["Birthday Cakes", "Wedding Cakes", "Customized Cakes"],
  "Transportation": ["Luxury Cars", "Wedding Cars", "Buses"],
  "Return Gifts": ["Wedding Gifts", "Birthday Gifts", "Corporate Gifts"]
};

const PACKAGE_TIERS = ["Basic", "Standard", "Premium"];

async function main() {
  console.log("🚀 Starting Refined Seed Process...");

  const tables = [
    "activitylog", "auditlog", "availability", "booking", "bookingassignment", "bookingitem",
    "bookingstatuslog", "staff", "cart", "cartitem", "category", "conversation",
    "conversationparticipant", "coupon", "dispute", "eventcheckin", "globalsettings",
    "invoice", "locationtrackinglog", "message", "messageattachment", "notification",
    "package", "payment", "payment_split", "payout", "portfolio", "pricingrule",
    "refreshtoken", "refund", "review", "service", "servicetype", "subcategory",
    "transaction", "user", "vendordocument", "vendorprofile", "recurringavailability",
    "vendorscore", "wallet", "webhookevent", "wishlist", "wishlistitem",
    "passwordresettoken", "subscriptionpayment", "subscriptionplan", "vendorsubscription",
    "eventtype"
  ];

  await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (e) {}
  }
  await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);

  const hashedPassword = await bcrypt.hash("Password@123", 10);

  // 0. Create Event Types
  console.log("🎭 Creating event types...");
  const eventTypeMap = {};
  for (const et of EVENT_TYPES) {
    const created = await prisma.eventtype.create({
      data: { id: randomUUID(), name: et.name, description: et.description, icon: et.icon }
    });
    eventTypeMap[et.name] = created;
  }

  // 1. Subscription Plans
  console.log("💳 Creating subscription plans...");
  const freePlan = await prisma.subscriptionplan.create({
    data: { id: randomUUID(), name: "FREE", price: 0, durationMonths: 120, listingLimit: 3, rank: 0, features: JSON.stringify(["Basic"]), updatedAt: new Date() }
  });

  // 2. Categories & Subcategories
  console.log("📁 Creating categories and hierarchy...");
  const serviceTypeMap = {};
  for (const cat of CATEGORIES) {
    const createdCat = await prisma.category.create({
      data: {
        id: randomUUID(),
        name: cat.name,
        icon: cat.icon,
        description: `Elite ${cat.name} services.`,
        eventtypes: { connect: cat.eventTypes.map(name => ({ id: eventTypeMap[name].id })) }
      }
    });

    const subs = SUB_DATA[cat.name] || [];
    for (const subName of subs) {
      const sub = await prisma.subcategory.create({
        data: { id: randomUUID(), name: subName, categoryId: createdCat.id }
      });
      const st = await prisma.servicetype.create({
        data: { id: randomUUID(), name: `${subName} Service`, subcategoryId: sub.id, description: `Professional ${subName} solutions.` }
      });
      serviceTypeMap[subName] = st;
    }
  }

  // 3. Create vendors and services
  console.log("🏪 Creating Vendors and Services...");
  for (let i = 0; i < 5; i++) {
    const city = CITIES[i % CITIES.length];
    const userId = randomUUID();
    const vendorProfileId = randomUUID();

    await prisma.user.create({
      data: {
        id: userId,
        email: `vendor${i}@manaevents.in`,
        password: hashedPassword,
        fullName: `Vendor Owner ${i}`,
        mobileNumber: `900000000${i}`,
        role: "VENDOR",
        updatedAt: new Date(),
        vendorprofile: {
          create: {
            id: vendorProfileId,
            businessName: `Elite Services ${i}`,
            city: city.name,
            state: city.state,
            verificationStatus: "APPROVED",
            rating: 4.5,
            vendorsubscription: { create: { id: randomUUID(), planId: freePlan.id, startDate: new Date(), endDate: new Date(Date.now() + 31536000000), updatedAt: new Date() } }
          }
        }
      }
    });

    // Create 2 services for this vendor
    const subNames = Object.keys(serviceTypeMap);
    for (let j = 0; j < 2; j++) {
      const subName = subNames[(i + j) % subNames.length];
      const st = serviceTypeMap[subName];
      const serviceId = randomUUID();

      // Determine pricing type
      const isCatering = subName.includes("Catering");
      const pricingType = isCatering ? "PER_GUEST" : "PACKAGE";

      const service = await prisma.service.create({
        data: {
          id: serviceId,
          vendorProfileId: vendorProfileId,
          serviceTypeId: st.id,
          title: `${subName} Special`,
          description: `High quality ${subName} for all events.`,
          basePrice: 5000,
          pricingType: pricingType,
          updatedAt: new Date(),
        }
      });

      for (let idx = 0; idx < PACKAGE_TIERS.length; idx++) {
        const tier = PACKAGE_TIERS[idx];
        const multiplier = idx + 1;
        const pkgId = randomUUID();

        await prisma.renamedpackage.create({
          data: {
            id: pkgId,
            serviceId: serviceId,
            name: `${tier} Package`,
            price: 5000 * multiplier,
            description: `${tier} level service.`,
            inclusions: JSON.stringify(["Basic Setup", "Professional Support", "Equipment"]),
            pricingrule: {
              create: [
                { id: randomUUID(), minGuests: 0, maxGuests: 100, pricePerGuest: 100 * multiplier, flatFee: 0 },
                { id: randomUUID(), minGuests: 101, maxGuests: 500, pricePerGuest: 80 * multiplier, flatFee: 500 * multiplier },
                { id: randomUUID(), minGuests: 501, maxGuests: 5000, pricePerGuest: 60 * multiplier, flatFee: 2000 * multiplier },
              ]
            }
          }
        });
      }
    }

    // Add some availability
    const today = new Date();
    today.setHours(0,0,0,0);
    for(let d=0; d<30; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() + d);
        await prisma.availability.create({
            data: { id: randomUUID(), vendorProfileId: vendorProfileId, date: date, isAvailable: true, bookingLimit: 5 }
        });
    }
  }

  // 4. Create Customer
  console.log("👤 Creating Customer...");
  await prisma.user.create({
    data: {
      id: randomUUID(),
      email: "customer@manaevents.in",
      password: hashedPassword,
      fullName: "Main Customer",
      mobileNumber: "9876543210",
      role: "CUSTOMER",
      updatedAt: new Date()
    }
  });

  console.log("✅ Refined Seed Complete!");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => await prisma.$disconnect());
