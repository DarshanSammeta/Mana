import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deepAudit() {
  console.log("--- DEEP MEDIA & ORPHAN AUDIT ---");

  const results: any = {
    orphans: {},
    mediaErrors: [],
    pricingInconsistencies: [],
    payloadEstimation: {}
  };

  try {
    // 1. Orphans
    const vendors = await prisma.vendorprofile.findMany({ select: { id: true } });
    const vendorIds = vendors.map(v => v.id);
    results.orphans.servicesWithoutVendor = await prisma.service.count({
      where: { vendorProfileId: { notIn: vendorIds } }
    });

    const services = await prisma.service.findMany({ select: { id: true } });
    const serviceIds = services.map(s => s.id);
    results.orphans.packagesWithoutService = await prisma.renamedpackage.count({
      where: { serviceId: { notIn: serviceIds } }
    });

    const packages = await prisma.renamedpackage.findMany({ select: { id: true } });
    const packageIds = packages.map(p => p.id);
    results.orphans.addonsWithoutPackage = await prisma.package_addon.count({
      where: { packageId: { notIn: packageIds } }
    });
    results.orphans.pricingWithoutPackage = await prisma.pricingrule.count({
      where: { packageId: { notIn: packageIds } }
    });

    // 2. Media Audit
    const forbiddenKeywords = ["youtube.com", "youtu.be", "instagram.com", "facebook.com", "reels", "mp4", "pdf", "html"];

    const checkMedia = (urls: (string | null)[], context: string) => {
      for (const url of urls) {
        if (!url) continue;
        if (forbiddenKeywords.some(k => url.toLowerCase().includes(k))) {
          results.mediaErrors.push({ url, context, reason: "Forbidden keyword" });
        }
        if (!url.match(/\.(jpg|jpeg|png|webp|avif|svg)(\?.*)?$/i) && !url.includes("unsplash.com")) {
           results.mediaErrors.push({ url, context, reason: "Invalid extension or source" });
        }
      }
    };

    const portfolios = await prisma.portfolio.findMany();
    checkMedia(portfolios.filter(p => p.mediaType === "IMAGE").map(p => p.mediaUrl), "Portfolio Image");

    const vendorsList = await prisma.vendorprofile.findMany({ select: { logo: true, coverImage: true, businessName: true } });
    checkMedia(vendorsList.map(v => v.logo), "Vendor Logo");
    checkMedia(vendorsList.map(v => v.coverImage), "Vendor Cover");

    const packagesList = await prisma.renamedpackage.findMany({ select: { images: true, videos: true, name: true } });
    for (const pkg of packagesList) {
      if (Array.isArray(pkg.images)) {
        checkMedia(pkg.images as string[], `Package Images: ${pkg.name}`);
      }
    }

    // 3. Pricing Rule Audit
    const pricingRules = await prisma.pricingrule.findMany({
      orderBy: [{ packageId: "asc" }, { minGuests: "asc" }]
    });

    const packageSlabs: Record<string, any[]> = {};
    pricingRules.forEach(pr => {
      if (!packageSlabs[pr.packageId]) packageSlabs[pr.packageId] = [];
      packageSlabs[pr.packageId].push(pr);
    });

    const samplePkgId = Object.keys(packageSlabs)[0];
    if (samplePkgId) {
      results.pricingInconsistencies.push({
        examplePackageId: samplePkgId,
        slabs: packageSlabs[samplePkgId].map(s => `${s.minGuests}-${s.maxGuests}`)
      });
    }

    // 4. Payload Estimation
    const vendorData = await prisma.vendorprofile.findFirst({
      include: {
        service: {
          include: {
            Renamedpackage: { take: 5 },
            servicetype: { include: { subcategory: { include: { category: true } } } }
          }
        },
        portfolio: { take: 10 },
        review: { take: 5 },
        availability: { take: 10 }
      }
    });

    if (vendorData) {
      const size = Buffer.byteLength(JSON.stringify(vendorData));
      results.payloadEstimation = {
        sampleVendor: vendorData.businessName,
        sizeBytes: size,
        sizeKB: (size / 1024).toFixed(2)
      };
    }
  } catch (e: any) {
    results.error = e.message;
  }

  console.log(JSON.stringify(results, null, 2));
}

deepAudit().finally(() => prisma.$disconnect());
