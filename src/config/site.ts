export const siteConfig = {
  name: 'ShortDramaIndex',
  domain: 'shortdramaindex.com',
  description: 'The reference database for short vertical dramas. Search by any alias, explore verified legal watch sources, track titles, and view multilingual release details.',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://shortdramaindex.com',
  // TODO: Add hreflang support when translated routes exist
  links: {
    about: '/about',
    guidelines: '/guidelines',
    terms: '/terms',
    privacy: '/privacy',
    takedown: '/takedown',
    devKit: '/dev/kit',
  },
} as const;

export type SiteConfig = typeof siteConfig;
