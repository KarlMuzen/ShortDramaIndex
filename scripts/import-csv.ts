import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

interface CsvRow {
  title: string;
  original_title?: string;
  original_language: string;
  origin_country?: string;
  year: string;
  episodes: string;
  synopsis?: string;
  aliases?: string;
  alias_source_url?: string;
  platform_slug?: string;
  release_url?: string;
  poster_url?: string;
  tags?: string;
  cast?: string;
  production_type?: string;
  verification_status?: string;
  studio_name?: string;
  has_human_cast?: string;
  monetization_type?: string;
  free_episodes?: string;
  coins_per_episode?: string;
  estimated_unlock_cost_usd?: string;
  direct_watch_url?: string;
}

const KNOWN_PLATFORMS: Record<string, { name: string; url: string }> = {
  reelshort: { name: 'ReelShort', url: 'https://www.reelshort.com' },
  dramabox: { name: 'DramaBox', url: 'https://www.dramaboxapp.com' },
  shortmax: { name: 'ShortMax', url: 'https://www.shortmax.com' },
  'kalos-tv': { name: 'Kalos TV', url: 'https://www.kalostv.com' },
  goodshort: { name: 'GoodShort', url: 'https://www.goodshort.com' },
  netshort: { name: 'NetShort', url: 'https://www.netshort.com' },
  flextv: { name: 'FlexTV', url: 'https://www.flextv.cc' },
  youtube: { name: 'YouTube', url: 'https://www.youtube.com' },
  'kuku-tv': { name: 'Kuku TV', url: 'https://kukufm.com' },
  'zo-tv': { name: 'ZO TV', url: 'https://www.winzogames.com' },
  'pocket-saga': { name: 'Pocket Saga', url: 'https://pocketsaga.com' },
};

function platformNameForSlug(slug: string): string {
  return (
    KNOWN_PLATFORMS[slug]?.name ||
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function platformUrlForSlug(slug: string, releaseUrl?: string): string {
  if (KNOWN_PLATFORMS[slug]) return KNOWN_PLATFORMS[slug].url;
  if (releaseUrl) {
    try {
      return new URL(releaseUrl.trim()).origin;
    } catch {
      // fall through to slug-based fallback
    }
  }
  return `https://www.${slug}.com`;
}

function isValidHttpUrl(str?: string): boolean {
  if (!str) return false;
  try {
    const url = new URL(str.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function importCsv(filePath: string, isDryRun: boolean = false, isPublic: boolean = false) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isDryRun && (!supabaseUrl || !serviceRoleKey)) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required to import data.');
    process.exit(1);
  }

  // New-format Supabase secret keys (sb_secret_*) are not JWTs, so sending
  // one as an Authorization Bearer token makes PostgREST reject every call
  // with "Expected 3 parts in JWT". For non-JWT keys, strip Authorization
  // in a custom fetch and authenticate with the apikey header only — the
  // same pattern the working REST importer uses. Legacy JWT keys (three
  // dot-separated parts) keep the default client behaviour. The check is
  // on JWT shape, not the sb_secret_ prefix.
  const useApikeyOnly = (serviceRoleKey || '').split('.').length !== 3;
  const supabase = (!isDryRun && supabaseUrl && serviceRoleKey)
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        ...(useApikeyOnly
          ? {
              global: {
                fetch: (input: RequestInfo | URL, init?: RequestInit) => {
                  const headers = new Headers(init?.headers);
                  headers.delete('Authorization');
                  headers.set('apikey', serviceRoleKey);
                  return fetch(input, { ...init, headers });
                },
              },
            }
          : {}),
      })
    : null;

  if (!fs.existsSync(filePath)) {
    console.error(`Error: CSV file not found at path "${filePath}"`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    console.error('Error: CSV file must contain a header line and at least one data row.');
    process.exit(1);
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const expectedHeaders = [
    'title',
    'original_title',
    'original_language',
    'origin_country',
    'year',
    'episodes',
    'synopsis',
    'aliases',
    'alias_source_url',
    'platform_slug',
    'release_url',
    'poster_url',
    'tags',
    'cast',
    'production_type',
    'verification_status',
    'studio_name',
    'has_human_cast',
    'monetization_type',
    'free_episodes',
    'coins_per_episode',
    'estimated_unlock_cost_usd',
    'direct_watch_url',
  ];

  console.log(`Starting CSV import ${isDryRun ? '(DRY RUN)' : ''}...`);
  console.log(`Found ${lines.length - 1} data rows to process.\n`);

  let validCount = 0;
  let errorCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const values = parseCsvLine(lines[i]);
    const row: any = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    const rowErrors: string[] = [];

    // 1. Title validation
    if (!row.title || row.title.length < 1 || row.title.length > 200) {
      rowErrors.push('title is required and must be 1-200 characters');
    }

    // 2. Original title
    if (row.original_title && row.original_title.length > 200) {
      rowErrors.push('original_title must not exceed 200 characters');
    }

    // 3. Original language validation
    if (!row.original_language || row.original_language.length < 2 || row.original_language.length > 10) {
      rowErrors.push('original_language is required (2-10 char ISO code e.g. zh, en, ko)');
    }

    // 4. Origin country
    if (row.origin_country && (row.origin_country.length < 2 || row.origin_country.length > 10)) {
      rowErrors.push('origin_country must be 2-10 chars (e.g. CN, US, KR)');
    }

    // 5. Year validation
    const yearNum = parseInt(row.year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      rowErrors.push(`year must be a valid number between 1900 and 2100 (got "${row.year}")`);
    }

    // 6. Episodes validation
    const episodesNum = parseInt(row.episodes, 10);
    if (isNaN(episodesNum) || episodesNum < 1) {
      rowErrors.push(`episodes must be an integer >= 1 (got "${row.episodes}")`);
    }

    // 7. Synopsis validation
    if (row.synopsis && row.synopsis.length > 4000) {
      rowErrors.push('synopsis must not exceed 4000 characters');
    }

    // 8. Aliases and Source URL validation
    const aliasEntries: { language: string; text: string }[] = [];
    if (row.aliases && row.aliases.trim()) {
      const parts = row.aliases.split('|');
      for (const p of parts) {
        const [lang, ...rest] = p.split(':');
        const text = rest.join(':').trim();
        if (!lang || !text) {
          rowErrors.push(`invalid alias format in "${p}", expected "lang:text"`);
        } else if (text.length > 200) {
          rowErrors.push(`alias "${text}" exceeds 200 characters`);
        } else {
          aliasEntries.push({ language: lang.trim(), text });
        }
      }

      if (!row.alias_source_url || !isValidHttpUrl(row.alias_source_url)) {
        rowErrors.push('alias_source_url must be a valid http:// or https:// URL when aliases are provided');
      }
    }

    // Homepage URLs are not watch links: a URL whose pathname is just "/"
    // points at a platform homepage, not a title, and is rejected outright
    // so homepage fallbacks can never enter the database again.
    const isHomepageUrl = (value: string): boolean => {
      try {
        const pathname = new URL(value.trim()).pathname;
        return pathname === '/' || pathname === '';
      } catch {
        return false;
      }
    };

    // 9. Platform release validation
    if (row.platform_slug && row.release_url) {
      if (!isValidHttpUrl(row.release_url)) {
        rowErrors.push('release_url must be a valid http:// or https:// URL');
      } else if (isHomepageUrl(row.release_url)) {
        rowErrors.push('release_url must point to a title/watch page, not a platform homepage (pathname "/")');
      }
    }

    // 10. Poster URL validation (optional): external http(s) URL or a local /posters/ asset
    if (row.poster_url && !isValidHttpUrl(row.poster_url) && !row.poster_url.startsWith('/posters/')) {
      rowErrors.push('poster_url must be a valid http:// or https:// URL or a local /posters/ path');
    }

    // 11a. Cast validation (optional, pipe-separated "Actor Name:Character Name" or "Actor Name")
    const castEntries: { actorName: string; characterName?: string }[] = [];
    if (row.cast && row.cast.trim()) {
      for (const part of row.cast.split('|')) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const [actorName, ...rest] = trimmed.split(':');
        const characterName = rest.join(':').trim() || undefined;
        if (!actorName || !actorName.trim()) {
          rowErrors.push(`invalid cast format in "${part}", expected "Actor Name" or "Actor Name:Character Name"`);
        } else if (actorName.trim().length > 200) {
          rowErrors.push(`cast actor "${actorName.trim()}" exceeds 200 characters`);
        } else if (characterName && characterName.length > 200) {
          rowErrors.push(`cast character "${characterName}" exceeds 200 characters`);
        } else {
          castEntries.push({ actorName: actorName.trim(), characterName });
        }
      }
    }

    // 11b. Editorial verification & monetization (all optional; blank means "leave as-is / unknown", never a guessed value)
    const PRODUCTION_TYPES = ['live_action', 'hybrid', 'animation', 'ai_assisted'];
    const VERIFICATION_STATUSES = ['verified_commercial', 'editorial_approved', 'community_submitted', 'unverified'];
    const MONETIZATION_TYPES = ['coin_per_episode', 'subscription', 'ad_supported', 'free_with_ads', 'hybrid'];
    const parseOptionalInt = (value: string | undefined, field: string): number | undefined => {
      if (!value || !value.trim()) return undefined;
      const n = parseInt(value.trim(), 10);
      if (isNaN(n) || n < 0) rowErrors.push(`${field} must be an integer >= 0 (got "${value}")`);
      return n;
    };
    const parseOptionalNumber = (value: string | undefined, field: string): number | undefined => {
      if (!value || !value.trim()) return undefined;
      const n = parseFloat(value.trim());
      if (isNaN(n) || n < 0) rowErrors.push(`${field} must be a number >= 0 (got "${value}")`);
      return n;
    };
    let hasHumanCast: boolean | undefined;
    if (row.has_human_cast && row.has_human_cast.trim()) {
      const v = row.has_human_cast.trim().toLowerCase();
      if (['true', '1', 'yes'].includes(v)) hasHumanCast = true;
      else if (['false', '0', 'no'].includes(v)) hasHumanCast = false;
      else rowErrors.push(`has_human_cast must be true/false (got "${row.has_human_cast}")`);
    }
    if (row.production_type && !PRODUCTION_TYPES.includes(row.production_type.trim())) {
      rowErrors.push(`production_type must be one of ${PRODUCTION_TYPES.join(', ')} (got "${row.production_type}")`);
    }
    if (row.verification_status && !VERIFICATION_STATUSES.includes(row.verification_status.trim())) {
      rowErrors.push(`verification_status must be one of ${VERIFICATION_STATUSES.join(', ')} (got "${row.verification_status}")`);
    }
    if (row.monetization_type && !MONETIZATION_TYPES.includes(row.monetization_type.trim())) {
      rowErrors.push(`monetization_type must be one of ${MONETIZATION_TYPES.join(', ')} (got "${row.monetization_type}")`);
    }
    const freeEpisodes = parseOptionalInt(row.free_episodes, 'free_episodes');
    const coinsPerEpisode = parseOptionalInt(row.coins_per_episode, 'coins_per_episode');
    const estimatedUnlockCostUsd = parseOptionalNumber(row.estimated_unlock_cost_usd, 'estimated_unlock_cost_usd');
    if (row.direct_watch_url && !isValidHttpUrl(row.direct_watch_url)) {
      rowErrors.push('direct_watch_url must be a valid http:// or https:// URL');
    } else if (row.direct_watch_url && isHomepageUrl(row.direct_watch_url)) {
      rowErrors.push('direct_watch_url must point to a title/watch page, not a platform homepage (pathname "/")');
    }
    // Only fields the CSV actually provides are written; omitted fields keep their existing DB value on update.
    const seriesOptionalFields: Record<string, unknown> = {};
    if (row.production_type?.trim()) seriesOptionalFields.production_type = row.production_type.trim();
    if (row.verification_status?.trim()) seriesOptionalFields.verification_status = row.verification_status.trim();
    if (row.studio_name?.trim()) seriesOptionalFields.studio_name = row.studio_name.trim();
    if (hasHumanCast !== undefined) seriesOptionalFields.has_human_cast = hasHumanCast;
    // The CSV has no avg_episode_minutes column; short dramas average
    // ~2 minutes per episode, so imported series get 2 when unspecified.
    seriesOptionalFields.avg_episode_minutes = 2;
    const releaseOptionalFields: Record<string, unknown> = {};
    // Episodes from the CSV are the release's episode count as well.
    releaseOptionalFields.episode_count = episodesNum;
    if (row.monetization_type?.trim()) releaseOptionalFields.monetization_type = row.monetization_type.trim();
    if (freeEpisodes !== undefined) releaseOptionalFields.free_episodes = freeEpisodes;
    if (coinsPerEpisode !== undefined) releaseOptionalFields.coins_per_episode = coinsPerEpisode;
    if (estimatedUnlockCostUsd !== undefined) releaseOptionalFields.estimated_unlock_cost_usd = estimatedUnlockCostUsd;
    if (row.direct_watch_url?.trim()) releaseOptionalFields.direct_watch_url = row.direct_watch_url.trim();

    // 11. Tags validation (optional, pipe-separated tag names)
    const tagEntries: { slug: string; name: string }[] = [];
    if (row.tags && row.tags.trim()) {
      for (const part of row.tags.split('|')) {
        const name = part.trim();
        if (!name) continue;
        if (name.length > 100) {
          rowErrors.push(`tag "${name}" exceeds 100 characters`);
        } else {
          tagEntries.push({ slug: slugify(name), name });
        }
      }
    }

    if (rowErrors.length > 0) {
      errorCount++;
      console.error(`Row ${rowNumber} [FAILED]:`);
      rowErrors.forEach((err) => console.error(`  - ${err}`));
      continue;
    }

    validCount++;

    if (isDryRun) {
      console.log(`Row ${rowNumber} [OK]: "${row.title}" (${yearNum}, ${episodesNum} eps) -> would insert as ${isPublic ? 'public' : 'hidden'}`);
    } else if (supabase) {
      try {
        const slug = `${slugify(row.title)}-${yearNum}`;
        // Idempotent series: reuse an existing row with the same slug, updating it, instead of inserting a duplicate.
        const { data: existingSeries } = await supabase
          .from('series')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        let seriesId: number;
        let seriesAction: 'Inserted' | 'Updated';
        if (existingSeries) {
          const { error: updateError } = await supabase
            .from('series')
            .update({
              title: row.title,
              romanized_title: row.original_title || null,
              original_language: row.original_language,
              origin_country: row.origin_country || null,
              year: yearNum,
              episode_count: episodesNum,
              synopsis: row.synopsis || '',
              poster_url: row.poster_url || null,
              production_status: 'completed',
              visibility: isPublic ? 'public' : 'hidden',
              ...seriesOptionalFields,
            })
            .eq('id', existingSeries.id);
          if (updateError) {
            errorCount++;
            console.error(`Row ${rowNumber} [DB ERROR]: ${updateError.message || 'Failed to update series'}`);
            continue;
          }
          seriesId = existingSeries.id;
          seriesAction = 'Updated';
        } else {
          const { data: seriesData, error: seriesError } = await supabase
            .from('series')
            .insert({
              slug,
              title: row.title,
              romanized_title: row.original_title || null,
              original_language: row.original_language,
              origin_country: row.origin_country || null,
              year: yearNum,
              episode_count: episodesNum,
              synopsis: row.synopsis || '',
              poster_url: row.poster_url || null,
              production_status: 'completed',
              visibility: isPublic ? 'public' : 'hidden', // Imported as hidden for moderator review unless --public is passed
              ...seriesOptionalFields,
            })
            .select('id')
            .single();

          if (seriesError || !seriesData) {
            errorCount++;
            console.error(`Row ${rowNumber} [DB ERROR]: ${seriesError?.message || 'Failed to insert series'}`);
            continue;
          }
          seriesId = seriesData.id;
          seriesAction = 'Inserted';
        }

        // Insert aliases, skipping any (series_id, language, text) alias that already exists
        if (aliasEntries.length > 0) {
          for (const a of aliasEntries) {
            const { data: existingAlias } = await supabase
              .from('aliases')
              .select('id')
              .eq('series_id', seriesId)
              .eq('language', a.language)
              .eq('text', a.text)
              .maybeSingle();
            if (existingAlias) continue;
            await supabase.from('aliases').insert({
              series_id: seriesId,
              text: a.text,
              language: a.language,
              source_url: row.alias_source_url,
              source_label: 'CSV Import',
              status: isPublic ? 'verified' : 'pending',
            });
          }
        }

        // Insert tags: upsert each tag, then link it to the series
        if (tagEntries.length > 0) {
          for (const tag of tagEntries) {
            await supabase.from('tags').upsert(tag, { onConflict: 'slug' });
            await supabase.from('series_tags').upsert(
              { series_id: seriesId, tag_slug: tag.slug },
              { onConflict: 'series_id,tag_slug' }
            );
          }
        }

        // Insert cast: find-or-create each person by slug, then upsert the series_people link
        if (castEntries.length > 0) {
          for (const c of castEntries) {
            const personSlug = slugify(c.actorName);
            const { data: existingPerson } = await supabase
              .from('people')
              .select('id')
              .eq('slug', personSlug)
              .maybeSingle();
            let personId: number;
            if (existingPerson) {
              personId = existingPerson.id;
            } else {
              const { data: personData, error: personError } = await supabase
                .from('people')
                .insert({ slug: personSlug, name: c.actorName })
                .select('id')
                .single();
              if (personError || !personData) {
                console.error(`Row ${rowNumber} [DB ERROR]: failed to insert person "${c.actorName}": ${personError?.message || 'unknown error'}`);
                continue;
              }
              personId = personData.id;
            }
            await supabase.from('series_people').upsert(
              {
                series_id: seriesId,
                person_id: personId,
                role_type: 'actor',
                character_name: c.characterName || null,
              },
              { onConflict: 'series_id,person_id,role_type' }
            );
          }
        }

        // Upsert release by (series_id, platform_slug), ensuring the platform exists first.
        // If a release for that series+platform already exists, UPDATE its url (and the
        // monetization/episode/direct-watch fields) in place, so changing a broken URL in the
        // CSV never leaves an orphan 404 release row behind or creates a duplicate.
        // (This catalog holds exactly one release per series per platform.)
        // A row with no release_url but a direct_watch_url (e.g. a platform homepage) still gets a release
        // row for that direct URL, so the supplied direct_watch_url is never silently dropped.
        const effectiveReleaseUrl = row.release_url || row.direct_watch_url;
        if (row.platform_slug && effectiveReleaseUrl) {
          await supabase.from('platforms').upsert(
            {
              slug: row.platform_slug,
              name: platformNameForSlug(row.platform_slug),
              url: platformUrlForSlug(row.platform_slug, effectiveReleaseUrl),
            },
            { onConflict: 'slug' }
          );
          const { data: existingRelease } = await supabase
            .from('releases')
            .select('id')
            .eq('series_id', seriesId)
            .eq('platform_slug', row.platform_slug)
            .maybeSingle();
          if (!existingRelease) {
            await supabase.from('releases').insert({
              series_id: seriesId,
              platform_slug: row.platform_slug,
              url: effectiveReleaseUrl,
              is_official: true,
              region: 'Global',
              ...releaseOptionalFields,
            });
          } else {
            // Idempotent update: a re-import refreshes the URL and monetization columns
            // instead of duplicating the release.
            await supabase.from('releases').update({
              url: effectiveReleaseUrl,
              ...releaseOptionalFields,
            }).eq('id', existingRelease.id);
          }
        }

        console.log(`Row ${rowNumber} [SUCCESS]: ${seriesAction} ID #${seriesId} ("${row.title}") as ${isPublic ? 'public' : 'hidden'}`);
      } catch (err: any) {
        errorCount++;
        console.error(`Row ${rowNumber} [EXCEPTION]: ${err.message}`);
      }
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Total Rows Processed: ${lines.length - 1}`);
  console.log(`Valid: ${validCount}`);
  console.log(`Errors: ${errorCount}`);
}

// Run CLI execution
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isPublic = args.includes('--public');
const fileArgIdx = args.indexOf('--file');
const filePath = fileArgIdx !== -1 && args[fileArgIdx + 1] ? args[fileArgIdx + 1] : path.join(__dirname, 'sample.csv');

importCsv(filePath, isDryRun, isPublic).catch((err) => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
