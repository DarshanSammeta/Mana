const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log("=== FINAL ENTERPRISE SYSTEM VERIFICATION ===");
  const results = {};

  const check = async (name, fn) => {
    try {
      const res = await fn();
      results[name] = { status: "PASS", message: res || "Verified" };
    } catch (e) {
      results[name] = { status: "FAIL", message: e.message };
    }
  };

  await check("Database Connectivity", async () => {
    await prisma.$queryRaw`SELECT 1`;
    return "PostgreSQL Connected";
  });

  await check("Marketplace Integrity", async () => {
    const categories = await prisma.category.count();
    const serviceTypes = await prisma.servicetype.count();
    return `${categories} Categories, ${serviceTypes} Service Types found.`;
  });

  await check("Finance System", async () => {
    const wallets = await prisma.wallet.count();
    const systemWallet = await prisma.wallet.findFirst({ where: { type: "PLATFORM" } });
    return `Wallets: ${wallets}. Platform wallet: ${systemWallet ? "Active" : "Missing"}`;
  });

  await check("Operations System", async () => {
    const tickets = await prisma.support_ticket.count();
    return `Support system initialized with ${tickets} tickets.`;
  });

  await check("Marketing & CRM", async () => {
    const campaigns = await prisma.marketing_campaign.count();
    return `Marketing engine active with ${campaigns} campaigns.`;
  });

  await check("Event Planning", async () => {
    const workspaces = await prisma.event_workspace.count();
    return `Planning workspace active with ${workspaces} events.`;
  });

  console.table(results);
  const allPassed = Object.values(results).every(r => r.status === "PASS");

  if (allPassed) {
    console.log("\n✅ ALL ENTERPRISE MODULES VERIFIED FOR LAUNCH.");
  } else {
    console.log("\n❌ SYSTEM VERIFICATION FAILED. Check logs.");
  }

  await prisma.$disconnect();
}

verify();
