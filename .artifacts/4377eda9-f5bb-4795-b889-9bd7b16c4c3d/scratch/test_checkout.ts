import axios from 'axios';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const JWT_ACCESS_SECRET = "mana-event-secret-key-1234567890"; // from .env
const API_URL = "http://localhost:3000/api/customer/checkout";

// TEST DATA (from get_test_ids.ts)
const userId = "d331c48a-bae4-421a-8e00-719222791f46";
const vendorId = "091be15f-7604-4a52-b62d-f0227c3fddc7";
const serviceId = "f95e702f-7675-43ee-a614-e190c77ce0b5";
const packageId = "96a91230-e9aa-407a-beb9-e37f5454f639";

async function runTests() {
  console.log("--- STARTING CHECKOUT VERIFICATION ---");

  // 0. Sign Token
  const token = jwt.sign({ userId, role: "CUSTOMER" }, JWT_ACCESS_SECRET);
  const headers = { Authorization: `Bearer ${token}` };

  const idempotencyKey = "test_key_" + crypto.randomBytes(4).toString('hex');

  // Calculate expected total (manually or via pricing service)
  // Base price was 29451. Let's say guest count 100.
  // We'll just trigger PRICING_MISMATCH first to get the server's calculation.

  const basePayload = {
    vendorId,
    eventName: "Integration Test Event",
    eventDate: "2026-12-25",
    eventTime: "18:00",
    eventLocation: "Test Venue, Whitefield, Bengaluru",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560066",
    guestCount: 100,
    idempotencyKey,
    clientTotal: 5000, // Deliberately wrong
    items: [{
      serviceId,
      packageId,
      selectedAddonIds: []
    }]
  };

  // 1. Test PRICING_MISMATCH (409)
  console.log("\n1. Testing PRICING_MISMATCH (409)...");
  try {
    const res = await axios.post(API_URL, basePayload, { headers, validateStatus: () => true });
    console.log("Response Status:", res.status);
    console.log("Error Code:", res.data.code);
    if (res.status === 409) {
      const serverTotal = res.data.details.serverPricing.total;
      console.log("Correct Server Total:", serverTotal);
      basePayload.clientTotal = serverTotal;
    }
  } catch (e: any) {
    console.error("FAILED:", e.message);
  }

  // 2. Test First Attempt (201)
  console.log("\n2. Testing First Attempt (201)...");
  try {
    const res = await axios.post(API_URL, basePayload, { headers });
    console.log("Response Status:", res.status);
    console.log("Booking Number:", res.data.bookingNumber);
  } catch (e: any) {
    console.error("FAILED:", e.response?.data || e.message);
  }

  // 3. Test Idempotency Retry (200)
  console.log("\n3. Testing Idempotency Retry (200)...");
  try {
    const res = await axios.post(API_URL, basePayload, { headers });
    console.log("Response Status:", res.status);
    console.log("Booking Number (Matches?):", res.data.bookingNumber);
  } catch (e: any) {
    console.error("FAILED:", e.response?.data || e.message);
  }

  // 4. Test DB Confirmation
  console.log("\n4. Verifying DB Persistence...");
  const dbBooking = await prisma.booking.findUnique({
    where: { idempotencyKey },
    include: { bookingitem: true, bookingstatuslog: true }
  });
  console.log("Booking in DB:", dbBooking?.id);
  console.log("Item Count:", dbBooking?.bookingitem.length);
  console.log("Status Log Count:", dbBooking?.bookingstatuslog.length);

  // 5. Test Race Condition Simulation
  console.log("\n5. Testing Race Condition (Parallel requests)...");
  const raceKey = "race_key_" + crypto.randomBytes(4).toString('hex');
  const racePayload = { ...basePayload, idempotencyKey: raceKey };

  const startTime = Date.now();
  const results = await Promise.all([
    axios.post(API_URL, racePayload, { headers, validateStatus: () => true }),
    axios.post(API_URL, racePayload, { headers, validateStatus: () => true })
  ]);
  const duration = Date.now() - startTime;

  console.log("Request 1 Status:", results[0].status);
  console.log("Request 2 Status:", results[1].status);
  console.log("Test Duration:", duration, "ms");

  console.log("\n--- VERIFICATION COMPLETE ---");
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
