import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

async function runStep(name: string, command: string) {
  console.log(`\n--- [STEP] ${name} ---`);
  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✅ ${name} completed.`);
  } catch (e) {
    console.error(`❌ ${name} failed.`);
    process.exit(1);
  }
}

async function main() {
  console.log("====================================================");
  console.log("🛠️  MANA EVENTS – PLATFORM BOOTSTRAP");
  console.log("====================================================\n");

  // 1. Validate Env
  console.log("--- [STEP] Environment Validation ---");
  // We'll use the existing validator if possible, or just a simple check
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is missing in .env");
    process.exit(1);
  }

  // 2. Prisma Generate
  await runStep("Prisma Generate", "npx prisma generate");

  // 3. Database Migration
  await runStep("Database Migration", "npx prisma migrate deploy");

  // 4. Seed Database
  const prisma = new PrismaClient();
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    await runStep("Seeding Database", "npx prisma db seed");
  } else {
    console.log("⏩ Database already seeded, skipping...");
  }
  await prisma.$disconnect();

  // 5. Sync Search
  // await runStep("Meilisearch Sync", "npm run meili:sync");
  // Note: We might need to create this script if it doesn't exist or is different

  // 6. Run Health Check
  await runStep("Health Check", "npm run health");

  // 7. Final Verification
  await runStep("Final Verification", "npm run verify");

  console.log("\n====================================================");
  console.log("✨ BOOTSTRAP COMPLETE - PLATFORM READY");
  console.log("====================================================");
  console.log("Run the following to start development:");
  console.log("  npm run dev      # Start Next.js");
  console.log("  npm run worker   # Start Background Worker");
  console.log("====================================================\n");
}

main().catch(err => {
  console.error("Bootstrap crashed:", err);
  process.exit(1);
});
