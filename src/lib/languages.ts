/**
 * Map ISO language code to friendly English name
 */
export function getLanguageName(code: string): string {
  const map: Record<string, string> = {
    zh: 'Chinese',
    ko: 'Korean',
    en: 'English',
    es: 'Spanish',
    ja: 'Japanese',
    pt: 'Portuguese',
    vi: 'Vietnamese',
    th: 'Thai',
    fr: 'French',
    de: 'German',
    id: 'Indonesian',
  };
  return map[code?.toLowerCase()] || code?.toUpperCase() || 'Unknown';
}
