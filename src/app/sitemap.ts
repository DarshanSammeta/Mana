import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

import { APP_CONFIG } from '@/config/app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_CONFIG.url;

  try {
    const BATCH_SIZE = 500;
    let skip = 0;
    let allVendors: { id: string, updatedAt: Date }[] = [];

    while (true) {
      const vendors = await prisma.vendorprofile.findMany({
        where: { verificationStatus: 'APPROVED' },
        select: { id: true, updatedAt: true },
        take: BATCH_SIZE,
        skip: skip,
        orderBy: { updatedAt: 'desc' }
      });

      if (vendors.length === 0) break;
      allVendors = [...allVendors, ...vendors];
      skip += BATCH_SIZE;
    }

    const vendorUrls = allVendors.map((vendor) => ({
      url: `${baseUrl}/marketplace/vendor/${vendor.id}`,
      lastModified: vendor.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/marketplace`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      ...vendorUrls,
    ];
  } catch (error) {
    console.error('Sitemap generation failed, returning base URLs:', error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/marketplace`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
    ];
  }
}
