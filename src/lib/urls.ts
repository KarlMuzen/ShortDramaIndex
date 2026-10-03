/**
 * Helper to slugify text into a clean URL segment.
 * Falls back to romanized/English text or a given fallback when text contains CJK or results in an empty slug.
 */
export function slugify(text: string, fallback?: string): string {
  if (!text) return fallback ? slugify(fallback) : 'untitled';

  // Attempt standard ascii slug
  const ascii = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens

  if (ascii.length > 0) {
    return ascii;
  }

  // If text is CJK or non-ascii and fallback is provided, use fallback
  if (fallback) {
    const fallbackSlug = slugify(fallback);
    if (fallbackSlug !== 'untitled' && fallbackSlug.length > 0) {
      return fallbackSlug;
    }
  }

  // If no fallback works, encode safe hexadecimal or general slug
  return 'title';
}

/**
 * Returns canonical title path: /title/{id}-{slug}
 */
export function titlePath(series: { id: number; slug: string }): string {
  return `/title/${series.id}-${series.slug}`;
}

/**
 * Parses numeric ID from title route parameter (e.g., "101-hidden-billionaire" -> 101)
 */
export function parseTitleParam(param: string): number | null {
  if (!param) return null;
  const match = param.match(/^(\d+)/);
  if (!match) return null;
  const id = parseInt(match[1], 10);
  return isNaN(id) ? null : id;
}

/**
 * Returns canonical person path: /person/{id}-{slug}
 */
export function personPath(person: { id: number; slug: string }): string {
  return `/person/${person.id}-${person.slug}`;
}

/**
 * Parses numeric ID from person route parameter
 */
export function parsePersonParam(param: string): number | null {
  if (!param) return null;
  const match = param.match(/^(\d+)/);
  if (!match) return null;
  const id = parseInt(match[1], 10);
  return isNaN(id) ? null : id;
}

/**
 * Returns canonical tag path
 */
export function tagPath(tag: { slug: string } | string): string {
  const slug = typeof tag === 'string' ? tag : tag.slug;
  return `/tag/${slug}`;
}

/**
 * Returns canonical platform path
 */
export function platformPath(platform: { slug: string } | string): string {
  const slug = typeof platform === 'string' ? platform : platform.slug;
  return `/platform/${slug}`;
}
