import { prisma } from "@/lib/prisma";

async function test() {
  const start = Date.now();
  console.log("Starting DB query test...");

  try {
    // Find a vendor user first
    const vendor = await prisma.vendorprofile.findFirst({
        select: { userId: true }
    });

    if (!vendor) {
        console.log("No vendor found in DB");
        return;
    }

    console.log(`Testing query for userId: ${vendor.userId}`);

    const profile = await prisma.vendorprofile.findUnique({
      where: { userId: vendor.userId },
      select: {
        id: true,
        businessName: true,
        description: true,
        logo: true,
        coverImage: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        serviceRadius: true,
        verificationStatus: true,
        rating: true,
        reviewCount: true,
        gstNumber: true,
        panNumber: true,
        aadhaarNumber: true,
        businessType: true,
        bankDetails: true,
        bufferTime: true,
        vacationMode: true,
        vacationStartDate: true,
        vacationEndDate: true,
        minBookingNotice: true,
        advanceBookingDays: true,
        website: true,
        socialLinks: true,
        workingHours: true,
        publicVisibility: true,
        user: {
          select: {
            fullName: true,
            email: true,
            mobileNumber: true,
            language: true,
            timezone: true,
            twoFactorEnabled: true,
          }
        },
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            pricingType: true,
            basePrice: true,
            serviceTypeId: true,
            Renamedpackage: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                inclusions: true,
              },
            },
          },
        },
        portfolio: {
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            title: true,
          },
        },
        availability: {
          select: {
            id: true,
            date: true,
            isAvailable: true,
          },
          where: {
            date: { gte: new Date() },
          },
          take: 30,
        },
        vendordocument: {
          select: {
            id: true,
            type: true,
            url: true,
            status: true,
          },
        },
      },
    });

    console.log(`Query finished in ${Date.now() - start}ms`);
    console.log("Profile found:", !!profile);
  } catch (error) {
    console.error("Query failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
