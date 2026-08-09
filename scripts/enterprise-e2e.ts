import axios from "axios";
import { signAccessToken } from "../src/lib/auth/token-logic";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();
const BASE_URL = process.env.APP_URL || "http://localhost:3000";

async function main() {
  console.log("--- STAGING ENTERPRISE E2E VALIDATION ---\n");

  const results: any = {
    customer: "FAIL",
    vendor: "FAIL",
    admin: "FAIL",
    infrastructure: "FAIL"
  };

  try {
    const customerUser = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
    const vendorUser = await prisma.user.findFirst({ where: { role: "VENDOR" } });
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });

    if (!customerUser || !vendorUser || !adminUser) throw new Error("Seed data missing.");

    const cHeaders = { headers: { Authorization: `Bearer ${await signAccessToken({ userId: customerUser.id, role: "CUSTOMER" })}` } };
    const vHeaders = { headers: { Authorization: `Bearer ${await signAccessToken({ userId: vendorUser.id, role: "VENDOR", verificationStatus: "APPROVED" })}` } };
    const aHeaders = { headers: { Authorization: `Bearer ${await signAccessToken({ userId: adminUser.id, role: "ADMIN" })}` } };

    console.log("[E2E] Testing Customer Journey...");
    const searchRes = await axios.get(`${BASE_URL}/api/marketplace/search?query=wedding`);
    if (searchRes.status !== 200 || !searchRes.data.length) throw new Error("Search failed.");

    const vendorId = searchRes.data[0].id;
    const vendorRes = await axios.get(`${BASE_URL}/api/marketplace/${vendorId}`);
    if (vendorRes.status !== 200) throw new Error("Vendor profile unreachable.");

    results.customer = "PASS";

    console.log("[E2E] Testing Vendor Journey...");
    const statsRes = await axios.get(`${BASE_URL}/api/vendor/dashboard/operational-stats`, vHeaders);
    if (statsRes.status !== 200) throw new Error("Vendor dashboard unreachable.");
    results.vendor = "PASS";

    console.log("[E2E] Testing Admin Journey...");
    const revRes = await axios.get(`${BASE_URL}/api/admin/dashboard/revenue`, aHeaders);
    if (revRes.status !== 200) throw new Error("Admin revenue API unreachable.");
    results.admin = "PASS";

    console.log("[E2E] Testing Infrastructure Probes...");
    const readyRes = await axios.get(`${BASE_URL}/api/ready`);
    const healthRes = await axios.get(`${BASE_URL}/api/health`);
    if (readyRes.data.status === "READY" && (healthRes.data.status === "OK" || healthRes.data.status === "DEGRADED")) {
        results.infrastructure = "PASS";
    }

  } catch (e: any) {
    console.error("❌ E2E Validation Error:", e.message);
  }

  console.log("\n--- E2E SUMMARY ---");
  console.table(results);
}

main().finally(() => prisma.$disconnect());
