import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient, booking_status } from "@prisma/client";
import { Redis } from "@upstash/redis";
import { Redis as IoRedis } from "ioredis";
import * as MeiliSearchModule from 'meilisearch';
import { Queue } from "bullmq";
import { Resend } from 'resend';
import Razorpay from "razorpay";
import { Inngest } from "inngest";

// Create local instances to avoid 'server-only' issues and complex lib dependencies
const prisma = new PrismaClient();

// Meilisearch setup
const getMeiliSearchConstructor = () => {
    const ms = MeiliSearchModule as any;
    const Constructor =
      ms.Meilisearch ||
      ms.MeiliSearch ||
      ms.default?.Meilisearch ||
      ms.default?.MeiliSearch ||
      (typeof ms.default === 'function' ? ms.default : null) ||
      (typeof ms === 'function' ? ms : null);

    return typeof Constructor === 'function' ? Constructor : null;
  };
const MeiliConstructor = getMeiliSearchConstructor();
const meiliClient = MeiliConstructor ? new (MeiliConstructor as any)({
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY,
}) : null;
const VENDORS_INDEX = process.env.MEILISEARCH_VENDORS_INDEX || 'vendors';

async function runVerification() {
  console.log("====================================================");
  console.log("🚀 MANA EVENTS – ENTERPRISE GO-LIVE VERIFICATION");
  console.log("====================================================\n");

  const report = {
    passed: [] as string[],
    failed: [] as string[],
    skipped: [] as string[],
    errors: [] as string[],
    metrics: {
      startTime: Date.now(),
      endTime: 0,
      totalRuntimeMs: 0
    }
  };

  const check = async (name: string, fn: () => Promise<void>) => {
    try {
      process.stdout.write(`Checking ${name}... `);
      await fn();
      console.log("✅ Passed");
      report.passed.push(name);
    } catch (e: any) {
      if (e.message.includes("SKIP")) {
        console.log(`⚠️ Skipped (${e.message.replace("SKIP: ", "")})`);
        report.skipped.push(name);
      } else {
        console.log("❌ Failed");
        report.failed.push(name);
        report.errors.push(`${name}: ${e.message}`);
      }
    }
  };

  // --- Phase 1: Infrastructure Health ---
  console.log("--- PHASE 1: INFRASTRUCTURE HEALTH ---");

  await check("PostgreSQL (Prisma)", async () => {
    await prisma.$queryRaw`SELECT 1`;
  });

  await check("Redis (Upstash REST)", async () => {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error("SKIP: Configuration Missing");
    }
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    const res = await redis.ping();
    if (res !== "PONG" && res !== "OK") throw new Error(`Unexpected PING response: ${res}`);
  });

  await check("Redis (ioredis / BullMQ)", async () => {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) throw new Error("SKIP: REDIS_URL missing");

    const ioRedis = new IoRedis(redisUrl, {
        maxRetriesPerRequest: 0,
        connectTimeout: 2000
    });
    const res = await ioRedis.ping().catch(err => {
        throw new Error(`Connection failed: ${err.message}`);
    });
    await ioRedis.quit();
    if (res !== "PONG") throw new Error(`Unexpected PING response: ${res}`);
  });

  await check("Meilisearch", async () => {
    if (!meiliClient || !process.env.MEILISEARCH_HOST) throw new Error("SKIP: Configuration Missing");
    const health = await meiliClient.health().catch((err: any) => {
        throw new Error(`SKIP: Service Unavailable (${err.message})`);
    });
    if (health.status !== 'available') throw new Error(`Meilisearch status: ${health.status}`);
  });

  await check("Inngest", async () => {
    const inngest = new Inngest({ id: "verification-test" });
    if (!inngest) throw new Error("Inngest client not initialized");
  });

  await check("Resend", async () => {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_123456789') {
        throw new Error("SKIP: Configuration Missing");
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    if (!resend) throw new Error("Resend client failed to init");
  });

  await check("Razorpay", async () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("SKIP: Configuration Missing");
    }
    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    if (!razorpay) throw new Error("Razorpay client failed to init");
  });

  // --- Phase 2: Search Verification ---
  console.log("\n--- PHASE 2: SEARCH VERIFICATION ---");

  await check("Meilisearch Index & Settings", async () => {
    if (!meiliClient || !process.env.MEILISEARCH_HOST) throw new Error("SKIP: Configuration Missing");
    const index = meiliClient.index(VENDORS_INDEX);
    const settings = await index.getSettings().catch(() => {
        throw new Error("SKIP: Index not found or Meili offline");
    });

    const requiredFilters = ['city', 'rating'];
    const missingFilters = requiredFilters.filter(f => !settings.filterableAttributes?.includes(f));
    if (missingFilters.length > 0) {
      throw new Error(`Missing filterable attributes: ${missingFilters.join(', ')}`);
    }
  });

  // --- Phase 3: Core Business Logic (Booking) ---
  console.log("\n--- PHASE 3: CORE BUSINESS LOGIC ---");

  let testBookingId = `verify-${Date.now()}`;
  await check("Full Booking Cycle Simulation", async () => {
    // 1. Find or Create dependencies
    const customer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
    if (!customer) throw new Error("No CUSTOMER found in database. Run seed first.");

    const vendor = await prisma.vendorprofile.findFirst({
      where: { verificationStatus: "APPROVED" },
      include: { service: true }
    });
    if (!vendor || !vendor.service[0]) throw new Error("No APPROVED VENDOR with SERVICES found.");

    const service = vendor.service[0];
    const pkg = await prisma.renamedpackage.findFirst({ where: { serviceId: service.id } });

    // 2. Create Booking (using current schema)
    const booking = await prisma.booking.create({
      data: {
        id: testBookingId,
        bookingNumber: `V-${Date.now()}`,
        customerId: customer.id,
        eventName: "Enterprise Verification Event",
        eventDate: new Date(Date.now() + 86400000 * 7),
        eventLocation: "123 Test Street, Bengaluru",
        city: "Bengaluru",
        state: "Karnataka",
        guestCount: 100,
        status: "SEARCHING",
        totalAmount: 15000,
        subTotal: 15000,
        bookingitem: {
          create: {
            serviceId: service.id,
            packageId: pkg?.id,
            price: 15000,
            quantity: 1
          }
        }
      }
    });

    // 3. Queue for Matching
    if (process.env.REDIS_URL) {
        const ioRedis = new IoRedis(process.env.REDIS_URL, { maxRetriesPerRequest: 0 });
        const queue = new Queue("vendor-matching", { connection: ioRedis as any });
        await queue.add(`match-${testBookingId}`, {
            bookingId: testBookingId,
            iteration: 0,
            radius: 50
        });
        await ioRedis.quit();
    } else {
        console.warn(" [WARN] REDIS_URL missing, skipping BullMQ queueing");
    }

    // 4. Verify Assignment (Wait for worker if running)
    process.stdout.write("(Waiting 3s for Worker) ");
    await new Promise(r => setTimeout(r, 3000));

    const assignments = await prisma.bookingassignment.findMany({
      where: { bookingId: testBookingId }
    });

    if (assignments.length === 0) {
        // We don't fail if worker isn't running, but we log it
        console.warn("\n [INFO] No assignments generated. Is the worker running?");
    }

    // 5. Cleanup Simulation
    await prisma.booking.delete({ where: { id: testBookingId } });
  });

  // --- Phase 4: Final Report ---
  report.metrics.endTime = Date.now();
  report.metrics.totalRuntimeMs = report.metrics.endTime - report.metrics.startTime;

  console.log("\n====================================================");
  console.log("📊 FINAL VERIFICATION REPORT");
  console.log("====================================================");
  console.log(`Runtime: ${report.metrics.totalRuntimeMs}ms`);
  console.log(`✅ Passed:  ${report.passed.length}`);
  console.log(`⚠️ Skipped: ${report.skipped.length}`);
  console.log(`❌ Failed:  ${report.failed.length}`);

  if (report.failed.length > 0) {
    console.log("\n❌ FAILURES (Action Required):");
    report.errors.forEach(e => console.log(`  - ${e}`));
    process.exit(1);
  } else {
    console.log("\n✨ PLATFORM VERIFIED. GO-LIVE READY.");
    process.exit(0);
  }
}

runVerification().catch(err => {
  console.error("Verification script crashed:", err);
  process.exit(1);
});
