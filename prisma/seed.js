const { PrismaClient, user_role, booking_status, payment_status, wallet_type, vendorprofile_verificationStatus, review_moderationStatus, notification_category, notification_priority } = require("@prisma/client");
const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const CONFIG = {
  EVENT_TYPES: 4,
  CATEGORIES_PER_EVENT_TYPE: 2, // 4 * 2 = 8 Categories
  VENDORS: 10,
  SERVICES_PER_VENDOR: 2,
  CUSTOMERS: 10,
  BOOKINGS: 20,
  AVAILABILITY_DAYS: 10,
};

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  const startTime = Date.now();
  const log = (msg) => console.log(`[${((Date.now() - startTime) / 1000).toFixed(1)}s] ${msg}`);

  try {
    log("🧹 Starting Clean...");
    // Use TRUNCATE for speed in dev
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "user" CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "subscriptionplan" CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "eventtype" CASCADE;`);

    const hashedPass = await bcrypt.hash("Mana@123", 10);

    log("💳 Creating Plans...");
    const plans = [
      { id: randomUUID(), name: "FREE", price: 0, durationMonths: 12, listingLimit: -1, features: {}, updatedAt: new Date() },
      { id: randomUUID(), name: "PRO", price: 1499, durationMonths: 12, listingLimit: -1, features: {}, updatedAt: new Date() },
      { id: randomUUID(), name: "ENTERPRISE", price: 4999, durationMonths: 12, listingLimit: -1, features: {}, updatedAt: new Date() },
    ];
    await prisma.subscriptionplan.createMany({ data: plans });

    log("🎭 Creating Event Types, Categories, Subcategories & ServiceTypes...");
    const eventTypes = ["Wedding", "Corporate", "Birthday", "Social"].map(name => ({
      id: randomUUID(),
      name,
      description: `${name} Events`,
      isActive: true,
      updatedAt: new Date()
    }));
    await prisma.eventtype.createMany({ data: eventTypes });

    const categories = [];
    const subcategories = [];
    const serviceTypes = [];

    for (const et of eventTypes) {
      for (let i = 1; i <= CONFIG.CATEGORIES_PER_EVENT_TYPE; i++) {
        const catId = randomUUID();
        categories.push({
          id: catId,
          name: `${et.name} Category ${i}`,
          eventTypeId: et.id,
          commissionRate: 10.00
        });

        const subId = randomUUID();
        subcategories.push({
          id: subId,
          name: `${et.name} Sub ${i}`,
          categoryId: catId
        });

        const stId = randomUUID();
        serviceTypes.push({
          id: stId,
          name: `${et.name} Specialist ${i}`,
          subcategoryId: subId
        });
      }
    }

    await prisma.category.createMany({ data: categories });
    await prisma.subcategory.createMany({ data: subcategories });
    await prisma.servicetype.createMany({ data: serviceTypes });

    const stIds = serviceTypes.map(st => st.id);

    log(`👤 Creating ${CONFIG.VENDORS} Vendors...`);
    const vendorUsers = [];
    const vendorProfiles = [];
    const vendorWallets = [];

    for (let i = 0; i < CONFIG.VENDORS; i++) {
      const uId = randomUUID();
      const vId = randomUUID();
      const email = `vendor${i}@mana.events`;

      vendorUsers.push({
        id: uId,
        email,
        password: hashedPass,
        fullName: `Vendor Name ${i}`,
        mobileNumber: `9${i.toString().padStart(9, '0')}`,
        role: user_role.VENDOR,
        updatedAt: new Date()
      });

      vendorProfiles.push({
        id: vId,
        userId: uId,
        businessName: `Biz ${i} ${vId.slice(0, 5)}`,
        city: "Hyderabad",
        state: "Telangana",
        verificationStatus: vendorprofile_verificationStatus.APPROVED,
        rating: 4.5,
        updatedAt: new Date()
      });

      vendorWallets.push({
        id: randomUUID(),
        userId: uId,
        type: wallet_type.VENDOR,
        balance: 0
      });
    }

    await prisma.user.createMany({ data: vendorUsers });
    await prisma.vendorprofile.createMany({ data: vendorProfiles });
    await prisma.wallet.createMany({ data: vendorWallets });

    log(`🛠️ Creating ${CONFIG.VENDORS * CONFIG.SERVICES_PER_VENDOR} Services...`);
    const services = [];
    const packages = [];

    for (const vp of vendorProfiles) {
      for (let i = 0; i < CONFIG.SERVICES_PER_VENDOR; i++) {
        const sId = randomUUID();
        services.push({
          id: sId,
          vendorProfileId: vp.id,
          serviceTypeId: getRandom(stIds),
          title: `Service ${i} for ${vp.businessName}`,
          description: "High quality professional service",
          basePrice: 10000,
          updatedAt: new Date()
        });

        packages.push({
          id: randomUUID(),
          serviceId: sId,
          name: "Standard Package",
          price: 12000,
          description: "Full service package",
          updatedAt: new Date() // package model doesn't have updatedAt according to schema, let's check
        });
      }
    }
    // Correcting package: schema says 'Renamedpackage' and no 'updatedAt'
    const packagesData = packages.map(({updatedAt, ...rest}) => rest);

    await prisma.service.createMany({ data: services });
    await prisma.renamedpackage.createMany({ data: packagesData });

    log(`📅 Creating Availability for ${CONFIG.AVAILABILITY_DAYS} days...`);
    const availData = [];
    const now = new Date();
    for (const vp of vendorProfiles) {
      for (let d = 0; d < CONFIG.AVAILABILITY_DAYS; d++) {
        const date = new Date(now);
        date.setDate(now.getDate() + d);
        availData.push({
          id: randomUUID(),
          vendorProfileId: vp.id,
          date,
          isAvailable: true,
          bookingLimit: 2
        });
      }
    }
    await prisma.availability.createMany({ data: availData });

    log(`👤 Creating ${CONFIG.CUSTOMERS} Customers...`);
    const customerUsers = [];
    const customerWallets = [];
    for (let i = 0; i < CONFIG.CUSTOMERS; i++) {
      const uId = randomUUID();
      customerUsers.push({
        id: uId,
        email: `customer${i}@mana.events`,
        password: hashedPass,
        fullName: `Customer Name ${i}`,
        mobileNumber: `8${i.toString().padStart(9, '0')}`,
        role: user_role.CUSTOMER,
        updatedAt: new Date()
      });
      customerWallets.push({
        id: randomUUID(),
        userId: uId,
        type: wallet_type.USER,
        balance: 1000
      });
    }
    await prisma.user.createMany({ data: customerUsers });
    await prisma.wallet.createMany({ data: customerWallets });

    log(`🎟️ Creating ${CONFIG.BOOKINGS} Bookings...`);
    const bookings = [];
    const payments = [];
    const reviews = [];
    const notifications = [];

    const cIds = customerUsers.map(c => c.id);

    for (let i = 0; i < CONFIG.BOOKINGS; i++) {
      const bId = randomUUID();
      const customerId = getRandom(cIds);
      const vendor = getRandom(vendorProfiles);

      bookings.push({
        id: bId,
        bookingNumber: `BK-${bId.slice(0, 8).toUpperCase()}`,
        customerId,
        vendorId: vendor.id,
        status: booking_status.EVENT_COMPLETED,
        totalAmount: 15000,
        eventDate: new Date(),
        eventLocation: "Hyderabad",
        city: "Hyderabad",
        state: "Telangana",
        guestCount: 100,
        updatedAt: new Date()
      });

      payments.push({
        id: randomUUID(),
        bookingId: bId,
        amount: 15000,
        status: payment_status.SUCCESS,
        updatedAt: new Date()
      });

      reviews.push({
        id: randomUUID(),
        userId: customerId,
        vendorId: vendor.id,
        bookingId: bId,
        rating: 5,
        comment: "Excellent service!",
        moderationStatus: review_moderationStatus.APPROVED,
        updatedAt: new Date()
      });

      notifications.push({
        id: randomUUID(),
        userId: customerId,
        title: "Booking Completed",
        message: "Your booking has been successfully completed.",
        category: notification_category.BOOKING,
        priority: notification_priority.MEDIUM,
        createdAt: new Date()
      });
    }

    await prisma.booking.createMany({ data: bookings });
    await prisma.payment.createMany({ data: payments });
    await prisma.review.createMany({ data: reviews });
    await prisma.notification.createMany({ data: notifications });

    log(`\n✅ Finished in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  } catch (e) {
    log(`❌ Error: ${e.message}`);
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
