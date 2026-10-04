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
 * Returns canonical title path: /title/<slug>-<shortId>
 */
export function titlePath(series: { slug: string; shortId?: string; id?: number | string }): string {
  const shortId = series.shortId || (series.id !== undefined ? String(series.id) : '');
  return `/title/${series.slug}-${shortId}`;
}

/**
 * Parses 5-character base36 short ID from title route parameter (e.g., "hidden-love-a1b2c" -> "a1b2c")
 */
export function parseTitleParam(param: string): string | null {
  if (!param) return null;
  const clean = param.trim().toLowerCase();
  if (/^[a-z0-9]{5}$/.test(clean)) return clean;
  const match = clean.match(/-([a-z0-9]{5})$/);
  if (match) return match[1];
  return null;
}

/**
 * Returns canonical person path: /person/<slug>-<shortId>
 */
export function personPath(person: { slug: string; shortId?: string; id?: number | string }): string {
  const shortId = person.shortId || (person.id !== undefined ? String(person.id) : '');
  return `/person/${person.slug}-${shortId}`;
}

/**
 * Parses 5-character base36 short ID from person route parameter
 */
export function parsePersonParam(param: string): string | null {
  if (!param) return null;
  const clean = param.trim().toLowerCase();
  if (/^[a-z0-9]{5}$/.test(clean)) return clean;
  const match = clean.match(/-([a-z0-9]{5})$/);
  if (match) return match[1];
  return null;
}

/**
 * Returns canonical tag path: /tag/<slug>
 */
export function tagPath(tag: { slug: string } | string): string {
  const slug = typeof tag === 'string' ? tag : tag.slug;
  return `/tag/${slug}`;
}

/**
 * Returns canonical platform path: /platform/<slug>
 */
export function platformPath(platform: { slug: string } | string): string {
  const slug = typeof platform === 'string' ? platform : platform.slug;
  return `/platform/${slug}`;
}
