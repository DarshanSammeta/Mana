const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");

const prisma = new PrismaClient();

async function addCustomer() {
  const hashedPassword = await bcrypt.hash("Password@123", 10);
  try {
    const existing = await prisma.user.findUnique({
      where: { email: "customer@manaevents.in" }
    });
    if (existing) {
      console.log("✅ Main Customer already exists.");
      return;
    }
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
    console.log("✅ Main Customer created successfully");
  } catch (e) {
    console.error("❌ Error creating customer:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

addCustomer();
