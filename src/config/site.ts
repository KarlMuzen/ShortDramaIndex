export const SEARCH_PLACEHOLDER = 'Search by any name';

export const siteConfig = {
  name: 'ShortDramaIndex',
  // Contact inbox is a Gmail address, not a mailbox on the unowned
  // shortdramaindex.com domain (which serves an unrelated site).
  contact: {
    legal: 'shortdramaindex@gmail.com',
    privacy: 'shortdramaindex@gmail.com',
  },
  description: 'The reference database for short dramas. Search by any alias, explore verified legal watch sources, track titles, and view multilingual release details.',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://shortdramaindex.vercel.app',
  searchPlaceholder: SEARCH_PLACEHOLDER,
  // TODO: Add hreflang support when translated routes exist
  links: {
    about: '/about',
    guidelines: '/guidelines',
    insights: '/insights',
    terms: '/terms',
    privacy: '/privacy',
    takedown: '/takedown',
  },
} as const;

export type SiteConfig = typeof siteConfig;
