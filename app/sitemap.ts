import { MetadataRoute } from 'next';
import { siteConfig } from '@/src/config/site';
import {
  getAllSeries,
  getAllTags,
  getAllPlatforms,
  getAllPeople,
} from '@/src/data/repository';

export async function generateSitemaps() {
  // 1 sitemap per 10,000 URLs
  return [{ id: 0 }];
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.baseUrl;
  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/guidelines`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/takedown`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  const [seriesList, tags, platforms, people] = await Promise.all([
    getAllSeries(),
    getAllTags(),
    getAllPlatforms(),
    getAllPeople(),
  ]);

  // Titles (only indexable titles: with synopsis or releases and not hidden)
  const titleRoutes: MetadataRoute.Sitemap = seriesList
    .filter((s) => (s.synopsis || s.releases.length > 0) && s.visibility !== 'hidden')
    .map((s) => ({
      url: `${baseUrl}/title/${s.id}-${s.slug}`,
      lastModified: s.updatedAt ? new Date(s.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.9,
    }));

  // Platform pages
  const platformRoutes: MetadataRoute.Sitemap = platforms.map((p) => ({
    url: `${baseUrl}/platform/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Tag pages
  const tagRoutes: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${baseUrl}/tag/${t.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // People pages
  const peopleRoutes: MetadataRoute.Sitemap = people.map((p) => ({
    url: `${baseUrl}/person/${p.id}-${p.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...titleRoutes,
    ...platformRoutes,
    ...tagRoutes,
    ...peopleRoutes,
  ];
}
