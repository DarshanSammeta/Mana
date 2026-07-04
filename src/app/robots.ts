import { MetadataRoute } from 'next';

import { APP_CONFIG } from '@/config/app';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = APP_CONFIG.url;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/vendor/dashboard/',
        '/customer/dashboard/',
        '/admin/',
        '/checkout/',
        '/login',
        '/register',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
