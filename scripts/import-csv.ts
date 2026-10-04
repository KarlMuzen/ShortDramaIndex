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

export async function importCsv(filePath: string, isDryRun: boolean = false) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isDryRun && (!supabaseUrl || !serviceRoleKey)) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required to import data.');
    process.exit(1);
  }

  const supabase = (!isDryRun && supabaseUrl && serviceRoleKey)
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
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

    // 9. Platform release validation
    if (row.platform_slug && row.release_url) {
      if (!isValidHttpUrl(row.release_url)) {
        rowErrors.push('release_url must be a valid http:// or https:// URL');
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
      console.log(`Row ${rowNumber} [OK]: "${row.title}" (${yearNum}, ${episodesNum} eps) -> would insert as hidden`);
    } else if (supabase) {
      try {
        const slug = `${slugify(row.title)}-${yearNum}`;
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
            production_status: 'completed',
            visibility: 'hidden', // Imported as hidden for moderator review
          })
          .select('id')
          .single();

        if (seriesError || !seriesData) {
          errorCount++;
          console.error(`Row ${rowNumber} [DB ERROR]: ${seriesError?.message || 'Failed to insert series'}`);
          continue;
        }

        const seriesId = seriesData.id;

        // Insert aliases
        if (aliasEntries.length > 0) {
          for (const a of aliasEntries) {
            await supabase.from('aliases').insert({
              series_id: seriesId,
              text: a.text,
              language: a.language,
              source_url: row.alias_source_url,
              source_label: 'CSV Import',
              status: 'pending',
            });
          }
        }

        // Insert release
        if (row.platform_slug && row.release_url) {
          await supabase.from('releases').insert({
            series_id: seriesId,
            platform_slug: row.platform_slug,
            url: row.release_url,
            is_official: true,
            region: 'Global',
          });
        }

        console.log(`Row ${rowNumber} [SUCCESS]: Inserted ID #${seriesId} ("${row.title}") as hidden`);
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
const fileArgIdx = args.indexOf('--file');
const filePath = fileArgIdx !== -1 && args[fileArgIdx + 1] ? args[fileArgIdx + 1] : path.join(__dirname, 'sample.csv');

importCsv(filePath, isDryRun).catch((err) => {
  console.error('Fatal import error:', err);
  process.exit(1);
});
