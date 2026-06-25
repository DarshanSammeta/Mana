import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://manaevents.in';

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
