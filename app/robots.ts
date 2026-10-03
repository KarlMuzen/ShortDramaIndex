import { MetadataRoute } from 'next';
import { siteConfig } from '@/src/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/mod',
        '/settings',
        '/sign-in',
        '/sign-up',
        '/login',
        '/title/*/edit',
        '/title/*/merge',
      ],
    },
    sitemap: `${siteConfig.baseUrl}/sitemap.xml`,
  };
}
