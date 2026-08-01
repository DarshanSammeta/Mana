import { loginSchema } from '../src/validations/auth';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("Testing Login Logic...");

  try {
    // 1. Create a user to test login
    const email = `login-test-${Date.now()}@test.com`;
    const password = "Password123!";
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        fullName: "Login Test User",
        email: email,
        password: hashedPassword,
        mobileNumber: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        role: "CUSTOMER",
        updatedAt: new Date(),
        customerprofile: {
          create: {
            id: crypto.randomUUID(),
            referralCode: `ME-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          }
        },
      }
    });

    console.log(`User created for login test: ${email}`);

    // 2. Validate login payload
    const payload = { email, password, role: "CUSTOMER" as const };
    const validated = loginSchema.parse(payload);

    // 3. Find user in DB
    const dbUser = await prisma.user.findUnique({ where: { email: validated.email } });
    if (!dbUser) throw new Error("User not found in DB");

    // 4. Compare password
    const isMatch = await bcrypt.compare(validated.password, dbUser.password);
    if (!isMatch) throw new Error("Password mismatch");

    console.log("[PASS] Login credentials verified successfully");

  } catch (error: any) {
    console.error("[FAIL] Login test failed:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
