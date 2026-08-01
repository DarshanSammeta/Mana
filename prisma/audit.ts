import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function audit() {
  console.log("🔍 Auditing Marketplace Data...");

  const report: any = {
    eventTypes: [],
    categories: [],
    inconsistencies: [],
    duplicates: [],
  };

  // 1. Audit Event Types
  const eventTypes = await prisma.eventtype.findMany({
    include: { categories: { include: { subcategory: { include: { servicetype: true } } } } }
  });
  report.eventTypes = eventTypes.map(et => ({
    name: et.name,
    categoryCount: et.categories.length,
    isComplete: et.categories.length > 0
  }));

  // 2. Audit Categories (Check for duplicates across event types)
  const allCategories = await prisma.category.findMany();
  const catNames = allCategories.map(c => c.name);
  const uniqueCats = new Set(catNames);
  if (uniqueCats.size < catNames.length) {
    report.duplicates.push(`Found ${catNames.length - uniqueCats.size} potential duplicate category names.`);
  }

  // 3. Check for missing hierarchy
  const subcatsWithoutServiceTypes = await prisma.subcategory.findMany({
    where: { servicetype: { none: {} } }
  });
  if (subcatsWithoutServiceTypes.length > 0) {
    report.inconsistencies.push(`${subcatsWithoutServiceTypes.length} subcategories have no service types.`);
  }

  const servicesWithoutPackages = await prisma.service.findMany({
    where: { Renamedpackage: { none: {} } }
  });
  if (servicesWithoutPackages.length > 0) {
    report.inconsistencies.push(`${servicesWithoutPackages.length} services have no packages.`);
  }

  const packagesWithoutAddons = await prisma.renamedpackage.findMany({
    where: { package_addon: { none: {} } }
  });
  if (packagesWithoutAddons.length > 0) {
    report.inconsistencies.push(`${packagesWithoutAddons.length} packages have no add-ons.`);
  }

  // 4. Audit Vendors
  const vendors = await prisma.vendorprofile.count();
  const vendorsWithoutServices = await prisma.vendorprofile.count({
    where: { service: { none: {} } }
  });
  report.vendors = {
    total: vendors,
    inactive: vendorsWithoutServices
  };

  console.log("--- AUDIT REPORT ---");
  console.log(JSON.stringify(report, null, 2));
}

audit().finally(() => prisma.$disconnect());
