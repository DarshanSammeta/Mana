import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

import { APP_CONFIG } from '@/config/app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_CONFIG.url;

  try {
    // Fetch all vendors to include in sitemap
    const vendors = await prisma.vendorprofile.findMany({
      where: { verificationStatus: 'APPROVED' },
      select: { id: true, updatedAt: true }
    });

    const vendorUrls = vendors.map((vendor) => ({
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
