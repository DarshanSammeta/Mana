import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log("Testing Registration Logic...");

  try {
    const email = `test-${Date.now()}@example.com`;
    const mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

    console.log(`Creating user with email: ${email}`);

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        fullName: "Test User",
        email: email,
        password: "HashedPassword123!",
        mobileNumber: mobile,
        role: "CUSTOMER",
        updatedAt: new Date(),
        customerprofile: {
          create: {
            id: crypto.randomUUID(),
            referralCode: `ME-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          }
        },
        wallet: {
          create: {
            id: crypto.randomUUID(),
            balance: 0,
            pendingBalance: 0,
            withdrawable: 0
          }
        },
        notification_preference: {
          create: {
            id: crypto.randomUUID(),
            category: "SYSTEM",
            email: true,
            sms: true,
            push: true
          }
        }
      },
    });

    console.log("User created successfully:", user.id);

    // Test Vendor Profile creation
    console.log("Creating vendor profile for user...");
    const vendor = await prisma.vendorprofile.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        businessName: "Test Business",
        description: "Test Description",
        experienceYears: 5,
        state: "Maharashtra",
        city: "Mumbai",
        address: "Test Address",
        zipCode: "400001",
        updatedAt: new Date(),
      },
    });

    console.log("Vendor profile created successfully:", vendor.id);

  } catch (error: any) {
    console.error("FAILED with error:");
    console.error("Code:", error.code);
    console.error("Meta:", error.meta);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
