/**
 * Map ISO 3166-1 alpha-2 country code to English country name
 */
const COUNTRY_NAMES: Record<string, string> = {
  CN: 'China',
  KR: 'South Korea',
  US: 'United States',
  GB: 'United Kingdom',
  JP: 'Japan',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  TH: 'Thailand',
  VN: 'Vietnam',
  PH: 'Philippines',
  ID: 'Indonesia',
  MY: 'Malaysia',
  SG: 'Singapore',
  CA: 'Canada',
  AU: 'Australia',
  ES: 'Spain',
  FR: 'France',
  DE: 'Germany',
  IT: 'Italy',
  BR: 'Brazil',
  MX: 'Mexico',
};

export function getCountryName(code?: string | null): string {
  if (!code) return '';
  const upper = code.trim().toUpperCase();
  if (COUNTRY_NAMES[upper]) {
    return COUNTRY_NAMES[upper];
  }
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    const name = displayNames.of(upper);
    if (name) return name;
  } catch {
    // ignore
  }
  return upper;
}
