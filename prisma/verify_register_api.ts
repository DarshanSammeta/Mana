import { registerSchema } from '../src/validations/auth';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testCustomer() {
  console.log("\n--- Testing Customer Registration ---");
  const payload = {
    fullName: "Customer Test",
    email: `customer-${Date.now()}@test.com`,
    mobileNumber: `8${Math.floor(100000000 + Math.random() * 900000000)}`,
    password: "Password123!",
    confirmPassword: "Password123!",
    role: "CUSTOMER",
    referralCode: ""
  };

  try {
    const validated = registerSchema.parse(payload);
    const hashedPassword = await bcrypt.hash(validated.password, 12);

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        fullName: validated.fullName,
        email: validated.email,
        password: hashedPassword,
        mobileNumber: validated.mobileNumber,
        role: validated.role,
        customerprofile: {
          create: {
            referralCode: `ME-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          }
        },
        updatedAt: new Date(),
        wallet: { create: { id: crypto.randomUUID() } },
        notification_preference: { create: { id: crypto.randomUUID(), category: "SYSTEM" } }
      }
    });
    console.log("[PASS] Customer created:", user.email);
    return user;
  } catch (e: any) {
    console.error("[FAIL] Customer registration failed:", e.message);
    throw e;
  }
}

async function testVendor() {
  console.log("\n--- Testing Vendor Registration ---");
  const payload = {
    fullName: "Vendor Test",
    email: `vendor-${Date.now()}@test.com`,
    mobileNumber: `7${Math.floor(100000000 + Math.random() * 900000000)}`,
    password: "Password123!",
    confirmPassword: "Password123!",
    role: "VENDOR",
    businessName: "Test Event Services",
    categoryId: "cat_clujv6y9w000208l2bh9f7z7k", // Assuming a category exists, we can fetch one
    experienceYears: 5,
    state: "Maharashtra",
    city: "Pune",
    address: "123 Business Hub",
    pincode: "411001",
    description: "Quality event services for all occasions."
  };

  try {
    // Fetch a real category ID from DB to be safe
    const category = await prisma.category.findFirst();
    if (category) {
        payload.categoryId = category.id;
    }

    const validated = registerSchema.parse(payload);
    const hashedPassword = await bcrypt.hash(validated.password, 12);

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        fullName: validated.fullName,
        email: validated.email,
        password: hashedPassword,
        mobileNumber: validated.mobileNumber,
        role: validated.role,
        customerprofile: {
          create: {
            referralCode: `ME-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          }
        },
        updatedAt: new Date(),
        wallet: { create: { id: crypto.randomUUID() } },
        notification_preference: { create: { id: crypto.randomUUID(), category: "SYSTEM" } }
      }
    });

    const vendor = await prisma.vendorprofile.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        businessName: validated.businessName!,
        description: validated.description,
        categoryId: validated.categoryId,
        experienceYears: validated.experienceYears,
        state: validated.state,
        city: validated.city,
        address: validated.address,
        zipCode: validated.pincode,
        updatedAt: new Date(),
      }
    });

    console.log("[PASS] Vendor created:", user.email, "Profile:", vendor.businessName);
    return { user, vendor };
  } catch (e: any) {
    console.error("[FAIL] Vendor registration failed:", e.message);
    throw e;
  }
}

async function main() {
  try {
    await testCustomer();
    await testVendor();
    console.log("\n✅ ALL REGISTRATION TESTS PASSED");
  } catch (e) {
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
