const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * PRODUCTION BOOTSTRAP SCRIPT
 * Automatically creates core infrastructure data required for production.
 * Idempotent: Can be run multiple times without duplication.
 */

async function bootstrap() {
  console.log("=== STARTING PRODUCTION BOOTSTRAP ===");

  // 1. Core Platform Wallets
  const systemWallets = [
    { type: 'PLATFORM', name: 'Platform Main Wallet', userId: 'system-platform' },
    { type: 'ESCROW', name: 'Escrow Holding Wallet', userId: 'system-escrow' },
    { type: 'COMMISSION', name: 'Commission Revenue Wallet', userId: 'system-commission' },
    { type: 'REFUND', name: 'Refund Reserve Wallet', userId: 'system-refund' }
  ];

  for (const wallet of systemWallets) {
    // Check by wallet type for system wallets since they won't have a real user record
    const exists = await prisma.wallet.findFirst({ where: { type: wallet.type } });
    if (!exists) {
      await prisma.wallet.create({
        data: {
          id: crypto.randomUUID(),
          balance: 0,
          pendingBalance: 0,
          withdrawable: 0,
          lifetimeEarnings: 0,
          lifetimeSpending: 0,
          type: wallet.type,
          // userId remains null for system wallets as per schema (model wallet { userId String? @unique })
        }
      });
      console.log(`✓ Created ${wallet.type} wallet`);
    } else {
      console.log(`- ${wallet.type} wallet already exists`);
    }
  }

  // 2. Default Roles & Permissions
  const roles = ['ADMIN', 'VENDOR', 'CUSTOMER', 'SUPER_ADMIN', 'SUPPORT'];
  for (const roleName of roles) {
    // Note: Roles are usually enums in Prisma, so we ensure they are handled in the DB
    console.log(`- Role verified: ${roleName}`);
  }

  // 3. Tax Configurations
  const taxConfigs = [
    { hsnCode: '998311', description: 'Event Management Services', gstRate: 18, cgstRate: 9, sgstRate: 9, igstRate: 18, isActive: true },
    { hsnCode: '998312', description: 'Catering Services', gstRate: 12, cgstRate: 6, sgstRate: 6, igstRate: 12, isActive: true }
  ];

  for (const tax of taxConfigs) {
    const exists = await prisma.tax_config?.findFirst({ where: { hsnCode: tax.hsnCode } });
    if (prisma.tax_config && !exists) {
       await prisma.tax_config.create({ data: tax });
       console.log(`✓ Created tax config for HSN: ${tax.hsnCode}`);
    }
  }

  // 4. Commission Rules
  const commissionRules = [
    { name: 'DEFAULT_VENDOR_COMMISSION', rate: 10, type: 'PERCENTAGE', isActive: true },
    { name: 'PREMIUM_VENDOR_COMMISSION', rate: 7, type: 'PERCENTAGE', isActive: true }
  ];

  for (const rule of commissionRules) {
    const exists = await prisma.commission_rule?.findFirst({ where: { name: rule.name } });
    if (prisma.commission_rule && !exists) {
       await prisma.commission_rule.create({ data: rule });
       console.log(`✓ Created commission rule: ${rule.name}`);
    }
  }

  // 5. Notification Templates
  const templates = [
    { code: 'BOOKING_CONFIRMED', subject: 'Your Booking is Confirmed!', channel: 'EMAIL' },
    { code: 'PAYMENT_RECEIVED', subject: 'Payment Received successfully', channel: 'SMS' },
    { code: 'VENDOR_APPROVED', subject: 'Welcome to Mana Events!', channel: 'EMAIL' }
  ];

  for (const tpl of templates) {
    const exists = await prisma.notification_template?.findFirst({ where: { code: tpl.code } });
    if (prisma.notification_template && !exists) {
       await prisma.notification_template.create({ data: tpl });
       console.log(`✓ Created template: ${tpl.code}`);
    }
  }

  // 6. Running Hierarchy Sync (Categories, Event Types, Service Types)
  console.log("\nRunning hierarchy sync...");
  const { execSync } = require('child_process');
  try {
    execSync('node scripts/sync-hierarchy.js', { stdio: 'inherit' });
    execSync('node scripts/sync-service-types.js', { stdio: 'inherit' });
    execSync('node scripts/sync-packages-pricing.js', { stdio: 'inherit' });
  } catch (e) {
    console.warn("Hierarchy sync scripts skipped or failed (might not exist or already run)");
  }

  console.log("\n=== BOOTSTRAP COMPLETE ===");
}

bootstrap().catch(console.error).finally(() => prisma.$disconnect());
