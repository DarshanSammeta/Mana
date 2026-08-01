import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { signAccessToken } from "../src/lib/jwt";
import * as dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();
const BASE_URL = process.env.APP_URL || "http://localhost:3000";

async function benchEndpoint(name: string, url: string, options: any = {}, iterations = 5) {
  const times: number[] = [];
  let payloadSize = 0;

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      const res = await axios({ url, ...options });
      times.push(Date.now() - start);
      if (i === 0) payloadSize = Buffer.byteLength(JSON.stringify(res.data));
    } catch (e: any) {
      console.error(`  [${name}] Failed:`, e.message, `(${url})`);
    }
  }

  const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  const p95 = times.length > 0 ? times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)] : 0;

  console.log(`> ${name}`);
  console.log(`  Avg: ${avg.toFixed(2)}ms | P95: ${p95?.toFixed(2)}ms | Payload: ${(payloadSize / 1024).toFixed(2)}KB`);
  return { name, avg, p95, payloadSize };
}

async function main() {
  console.log("--- ENTERPRISE PERFORMANCE BENCHMARK ---\n");

  const customer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
  const vendor = await prisma.user.findFirst({ where: { role: "VENDOR" } });

  if (!customer || !vendor) {
    console.error("Missing test users. Run seed first.");
    return;
  }

  const customerToken = signAccessToken({ userId: customer.id, role: "CUSTOMER" });
  const vendorToken = signAccessToken({ userId: vendor.id, role: "VENDOR" });

  const authHeaders = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  await benchEndpoint("Marketplace Search", `${BASE_URL}/api/marketplace/search?query=wedding`);

  const vendorProfile = await prisma.vendorprofile.findFirst();
  if (vendorProfile) {
    await benchEndpoint("Vendor Profile API", `${BASE_URL}/api/marketplace/${vendorProfile.id}`);
  }

  await benchEndpoint("Vendor Dashboard Stats", `${BASE_URL}/api/vendor/dashboard/operational-stats`, authHeaders(vendorToken));
  await benchEndpoint("Customer Stats", `${BASE_URL}/api/customer/stats`, authHeaders(customerToken));

  const booking = await prisma.booking.findFirst({ where: { customerprofile: { userId: customer.id } } });
  if (booking) {
    await benchEndpoint("Booking Details", `${BASE_URL}/api/customer/bookings/${booking.id}`, authHeaders(customerToken));
  }

  console.log("\n--- BENCHMARK COMPLETE ---");
}

main().finally(() => prisma.$disconnect());
