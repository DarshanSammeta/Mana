const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

const CITIES = [
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
  { name: "Secunderabad", state: "Telangana", lat: 17.4399, lng: 78.4983 },
  { name: "Warangal", state: "Telangana", lat: 17.9689, lng: 79.5941 },
  { name: "Karimnagar", state: "Telangana", lat: 18.4386, lng: 79.1288 },
  { name: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lng: 80.6480 },
  { name: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185 },
  { name: "Guntur", state: "Andhra Pradesh", lat: 16.3067, lng: 80.4365 },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
];

const EVENT_TYPES = [
  { name: "Wedding", description: "Grand wedding celebrations", icon: "wedding-icon" },
  { name: "Birthday Party", description: "Fun birthday parties", icon: "birthday-icon" },
  { name: "Corporate Event", description: "Professional business events", icon: "corporate-icon" },
  { name: "Social Gathering", description: "Casual and formal get-togethers", icon: "social-icon" },
  { name: "Anniversary", description: "Celebrating milestones", icon: "anniversary-icon" },
];

const EVENT_CATEGORY_CONFIG = [
  {
    eventTypeName: "Wedding",
    categories: [
      { name: "Photography", icon: "camera", subcategories: ["Wedding Photography", "Candid Wedding Photography", "Pre-Wedding Shoot", "Cinematic Wedding Film"] },
      { name: "Catering", icon: "utensils", subcategories: ["Traditional South Indian Buffet", "North Indian Wedding Feast", "Wedding Live Counters", "Premium Wedding Plated Service"] },
      { name: "Decoration", icon: "palette", subcategories: ["Mandap Decoration", "Floral Stage Decor", "Wedding Entrance Decor", "Thematic Wedding Decor"] },
      { name: "Cakes", icon: "cake", subcategories: ["Multi-tier Wedding Cake", "Engagement Photo Cake", "Wedding Anniversary Special Cake"] },
      { name: "Transportation", icon: "car", subcategories: ["Luxury Wedding Car Rental", "Vintage Car for Groom", "Guest Shuttle Buses"] },
      { name: "Return Gifts", icon: "gift", subcategories: ["Traditional Wedding Return Gifts", "Premium Gift Hampers", "Silver Article Gifts"] },
    ]
  },
  {
    eventTypeName: "Corporate Event",
    categories: [
      { name: "Photography", icon: "camera", subcategories: ["Conference Highlights Photography", "Corporate Headshots", "Product Launch Coverage", "Corporate Event Documentary"] },
      { name: "Catering", icon: "utensils", subcategories: ["Executive Working Lunch", "Corporate Dinner Buffet", "Networking High Tea & Snacks"] },
      { name: "DJ & Music", icon: "music", subcategories: ["Corporate DJ Services", "Professional Audio Setup", "Live Instrumental Band for Networking"] },
      { name: "Transportation", icon: "car", subcategories: ["Executive Airport Pickup", "Corporate Staff Shuttle"] },
    ]
  },
  {
    eventTypeName: "Birthday Party",
    categories: [
      { name: "Photography", icon: "camera", subcategories: ["Kids Birthday Photography", "Birthday Party Highlights"] },
      { name: "Catering", icon: "utensils", subcategories: ["Kids Special Menu", "Birthday Party Buffet", "Live Popcorn & Candy Stall"] },
      { name: "Decoration", icon: "palette", subcategories: ["Balloon Theme Decoration", "Superhero Theme Setup", "Princess Birthday Decor"] },
      { name: "Cakes", icon: "cake", subcategories: ["Birthday Theme Cake", "Custom Photo Cake", "Number Shaped Cake"] },
      { name: "Entertainment", icon: "smile", subcategories: ["Magic Show for Kids", "Puppet Show", "Face Painting Artist", "Mascot Performance"] },
      { name: "DJ & Music", icon: "music", subcategories: ["Kids Party DJ", "Music System Rental for Birthday"] },
      { name: "Return Gifts", icon: "gift", subcategories: ["Kids Return Gift Packs", "Creative Goodie Bags"] },
    ]
  },
  {
    eventTypeName: "Social Gathering",
    categories: [
      { name: "Photography", icon: "camera", subcategories: ["Social Event Coverage", "Candid Party Moments", "Family Gathering Photos"] },
      { name: "Catering", icon: "utensils", subcategories: ["Small Batch Catering", "Home Party Special Menu", "Cocktail Party Snacks"] },
      { name: "Decoration", icon: "palette", subcategories: ["House Party Decor", "Minimalist Floral Setup", "Garden Party Lighting"] },
      { name: "DJ & Music", icon: "music", subcategories: ["House Party DJ", "Live Acoustic Performance", "Karaoke System Setup"] },
      { name: "Entertainment", icon: "smile", subcategories: ["Stand-up Comedy", "Anchor/MC for Social Events"] },
      { name: "Return Gifts", icon: "gift", subcategories: ["Custom Souvenirs", "Social Event Thank You Gifts"] },
    ]
  },
  {
    eventTypeName: "Anniversary",
    categories: [
      { name: "Photography", icon: "camera", subcategories: ["Anniversary Portrait Shoot", "Couple Journey Documentary"] },
      { name: "Catering", icon: "utensils", subcategories: ["Fine Dining Anniversary Catering", "Anniversary Celebration Buffet"] },
      { name: "Decoration", icon: "palette", subcategories: ["Romantic Anniversary Decor", "Anniversary Stage Setup"] },
      { name: "Cakes", icon: "cake", subcategories: ["Anniversary Special Cake", "Couple Photo Cake for Anniversary"] },
    ]
  }
];

const VENDOR_COUNTS = {
  "Photography": 5,
  "Catering": 4,
  "Decoration": 4,
  "DJ & Music": 3,
  "Entertainment": 3,
  "Cakes": 3,
  "Transportation": 2,
  "Return Gifts": 2
};

const PACKAGE_TEMPLATES = [
  { name: "Basic Package", priceMultiplier: 1, guestMultiplier: 50 },
  { name: "Standard Package", priceMultiplier: 2, guestMultiplier: 100 },
  { name: "Premium Package", priceMultiplier: 3.5, guestMultiplier: 250 },
];

const BASE_PRICES = {
  "Photography": 15000,
  "Catering": 350,
  "Decoration": 10000,
  "DJ & Music": 8000,
  "Entertainment": 5000,
  "Cakes": 1500,
  "Transportation": 3000,
  "Return Gifts": 100
};

const ADJECTIVES = ["Elite", "Royal", "Sparkle", "Grand", "Magic", "Perfect", "Creative", "Dream", "Classic", "Modern"];
const NOUNS = ["Events", "Celebrations", "Occasions", "Solutions", "Planners", "Studios", "Kitchen", "Decors", "Sounds", "Vibes"];

function getRandom(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBusinessName() {
  return `${getRandom(ADJECTIVES)} ${getRandom(NOUNS)}`;
}

async function main() {
  console.log("🚀 Starting mega seed process...");

  console.log("🧹 Clearing old data...");
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
    } catch (e: any) {
      // console.log(`⚠️ Could not truncate ${table}: ${e.message}`);
    }
  }
  await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);

  const hashedPassword = await bcrypt.hash("Password@123", 10);

  // 0. Create Event Types
  console.log("🎭 Creating event types...");
  const eventTypeMap: Record<string, any> = {};
  for (const et of EVENT_TYPES) {
    const created = await prisma.eventtype.create({
      data: {
        id: randomUUID(),
        name: et.name,
        description: et.description,
        icon: et.icon,
        isActive: true
      }
    });
    eventTypeMap[et.name] = created;
  }

  // 1. Create Subscription Plans
  console.log("💳 Creating subscription plans...");
  const plans = [
    { name: "FREE", price: 0, durationMonths: 120, listingLimit: 3, rank: 0, features: JSON.stringify(["Basic Listing"]) },
    { name: "PRO", price: 1499, durationMonths: 1, listingLimit: -1, rank: 2, features: JSON.stringify(["Unlimited Listings", "Featured"]) }
  ];

  const planMap: Record<string, any> = {};
  for (const plan of plans) {
    const created = await prisma.subscriptionplan.create({
      data: {
        ...plan,
        id: randomUUID(),
        updatedAt: new Date()
      }
    });
    planMap[plan.name] = created;
  }

  // 2. Create Categories, Subcategories and Service Types
  console.log("📁 Creating scoped categories...");
  const serviceTypeMap: Record<string, string[]> = {}; // Map catName to array of stIds

  for (const etConfig of EVENT_CATEGORY_CONFIG) {
    const et = eventTypeMap[etConfig.eventTypeName];
    for (const catConfig of etConfig.categories) {
      const createdCat = await prisma.category.create({
        data: {
          id: randomUUID(),
          name: catConfig.name,
          description: `Professional ${catConfig.name} services for ${etConfig.eventTypeName}.`,
          icon: catConfig.icon,
          eventTypeId: et.id
        }
      });

      if (!serviceTypeMap[catConfig.name]) {
        serviceTypeMap[catConfig.name] = [];
      }

      for (const subName of catConfig.subcategories) {
        const sub = await prisma.subcategory.create({
          data: {
            id: randomUUID(),
            name: subName,
            categoryId: createdCat.id
          }
        });

        const st = await prisma.servicetype.create({
          data: {
            id: randomUUID(),
            name: `${subName} Service`,
            subcategoryId: sub.id,
            description: `Professional ${subName} services for your ${etConfig.eventTypeName}.`
          }
        });
        serviceTypeMap[catConfig.name].push(st.id);
      }
    }
  }

  // 3. Create Vendors and Services
  console.log("🏪 Creating vendors and service data...");

  let totalVendors = 0;
  for (const [catName, count] of Object.entries(VENDOR_COUNTS)) {
    console.log(`   - Generating ${count} vendors for ${catName}...`);

    for (let i = 0; i < count; i++) {
      const city = getRandom(CITIES);
      const businessName = generateBusinessName();
      const userId = randomUUID();
      const vendorProfileId = randomUUID();

      const user = await prisma.user.create({
        data: {
          id: userId,
          email: `vendor${totalVendors}@manaevents.in`,
          password: hashedPassword,
          fullName: `Owner of ${businessName}`,
          mobileNumber: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
          role: "VENDOR",
          updatedAt: new Date(),
          wallet: { create: { id: randomUUID(), type: "VENDOR", balance: 1000 } }
        }
      });

      const rating = 4.0 + (Math.random() * 1.0);
      const vendorProfile = await prisma.vendorprofile.create({
        data: {
          id: vendorProfileId,
          userId: user.id,
          businessName: businessName,
          description: `Award-winning ${catName} services based in ${city.name}.`,
          city: city.name,
          state: city.state,
          address: `${100 + i}, Main Road, ${city.name}`,
          zipCode: "500001",
          verificationStatus: "APPROVED",
          rating: rating,
          reviewCount: 5,
          totalBookings: 10,
          vendorsubscription: {
            create: {
              id: randomUUID(),
              planId: planMap["FREE"].id,
              startDate: new Date(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
              status: "ACTIVE",
              updatedAt: new Date()
            }
          }
        }
      });

      await prisma.vendorscore.create({
        data: {
          id: randomUUID(),
          vendorProfileId: vendorProfile.id,
          ratingScore: rating * 20,
          finalScore: rating * 10,
          updatedAt: new Date()
        }
      });

      const stIds = serviceTypeMap[catName] || [];
      if (stIds.length === 0) continue;

      const serviceTypeId = getRandom(stIds);
      const serviceId = randomUUID();
      const basePrice = (BASE_PRICES as Record<string, number>)[catName];

      const service = await prisma.service.create({
        data: {
          id: serviceId,
          vendorProfileId: vendorProfile.id,
          serviceTypeId: serviceTypeId,
          title: `${catName} - Professional Service`,
          description: `Elite ${catName} by ${businessName}.`,
          pricingType: catName === "Catering" ? "PER_GUEST" : "PACKAGE",
          basePrice: basePrice,
          updatedAt: new Date(),
        }
      });

      for (const pkgTemplate of PACKAGE_TEMPLATES) {
        const pkgId = randomUUID();
        const pkgPrice = basePrice * pkgTemplate.priceMultiplier;

        const pkg = await prisma.renamedpackage.create({
          data: {
            id: pkgId,
            serviceId: service.id,
            name: pkgTemplate.name,
            description: `Premium ${pkgTemplate.name} with extra features.`,
            price: pkgPrice,
            inclusions: JSON.stringify(["Equipment", "Staff", "Setup"]),
          }
        });

        if (service.pricingType === "PER_GUEST") {
          await prisma.pricingrule.create({
            data: {
              id: randomUUID(),
              packageId: pkg.id,
              minGuests: 10,
              maxGuests: pkgTemplate.guestMultiplier,
              pricePerGuest: basePrice,
              flatFee: 1000
            }
          });
        }
      }

      // Add availability for the next 30 days
      const today = new Date();
      for (let d = 0; d < 30; d++) {
        const date = new Date(today);
        date.setHours(0, 0, 0, 0);
        date.setDate(today.getDate() + d);
        await prisma.availability.create({
          data: {
            id: randomUUID(),
            vendorProfileId: vendorProfile.id,
            date: date,
            isAvailable: true,
            startTime: "09:00",
            endTime: "21:00",
            bookingLimit: 2
          }
        });
      }

      totalVendors++;
    }
  }

  // 4. Create Main Customer
  console.log("👤 Creating main customer...");
  await prisma.user.create({
    data: {
      id: randomUUID(),
      fullName: "Main Customer",
      email: "customer@manaevents.in",
      password: hashedPassword,
      mobileNumber: "9876543210",
      role: "CUSTOMER",
      updatedAt: new Date(),
      wallet: { create: { id: randomUUID(), balance: 10000, type: "USER" } }
    }
  });

  console.log("✅ Mega seeding complete!");
}

main()
  .catch((e: any) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
