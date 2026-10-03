import { MetadataRoute } from 'next';
import { siteConfig } from '@/src/config/site';
import {
  getAllSeries,
  getAllTags,
  getAllPlatforms,
  getAllPeople,
} from '@/src/data/repository';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.baseUrl;

  // Static routes (no lastModified, changeFrequency or priority)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
    },
    {
      url: `${baseUrl}/about`,
    },
    {
      url: `${baseUrl}/guidelines`,
    },
    {
      url: `${baseUrl}/takedown`,
    },
  ];

  const [seriesList, tags, platforms, people] = await Promise.all([
    getAllSeries(),
    getAllTags(),
    getAllPlatforms(),
    getAllPeople(),
  ]);

  // Titles: only public titles that have a synopsis or at least one release
  // Use updatedAt as lastModified for titles
  const titleRoutes: MetadataRoute.Sitemap = seriesList
    .filter(
      (s) =>
        s.visibility === 'public' &&
        (Boolean(s.synopsis) || s.releases.length > 0)
    )
    .map((s) => ({
      url: `${baseUrl}/title/${s.id}-${s.slug}`,
      lastModified: s.updatedAt ? new Date(s.updatedAt) : new Date(),
    }));

  // Platform pages (omit lastModified, changeFrequency, priority)
  const platformRoutes: MetadataRoute.Sitemap = platforms.map((p) => ({
    url: `${baseUrl}/platform/${p.slug}`,
  }));

  // Tag pages (omit lastModified, changeFrequency, priority)
  const tagRoutes: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${baseUrl}/tag/${t.slug}`,
  }));

  // People pages (omit lastModified, changeFrequency, priority)
  const peopleRoutes: MetadataRoute.Sitemap = people.map((p) => ({
    url: `${baseUrl}/person/${p.id}-${p.slug}`,
  }));

  return [
    ...staticRoutes,
    ...titleRoutes,
    ...platformRoutes,
    ...tagRoutes,
    ...peopleRoutes,
  ];
}
