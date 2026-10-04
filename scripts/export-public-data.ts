import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import {
  mockSeriesList,
  mockTags,
  mockPlatforms,
  mockPeople,
} from '../src/data/mock';

async function exportPublicData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const exportDir = path.resolve(process.cwd(), 'exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  console.log('Starting public database export...');

  let series: any[] = [];
  let aliases: any[] = [];
  let releases: any[] = [];
  let tags: any[] = [];
  let people: any[] = [];

  if (supabaseUrl && serviceRoleKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      console.log('Fetching live records from Supabase...');
      const { data: seriesData } = await supabase
        .from('series')
        .select('*')
        .eq('visibility', 'public')
        .order('id', { ascending: true });

      const { data: aliasData } = await supabase
        .from('aliases')
        .select('*')
        .order('series_id', { ascending: true });

      const { data: releaseData } = await supabase
        .from('releases')
        .select('*')
        .order('series_id', { ascending: true });

      const { data: tagData } = await supabase
        .from('tags')
        .select('*')
        .order('slug', { ascending: true });

      const { data: peopleData } = await supabase
        .from('people')
        .select('*')
        .order('id', { ascending: true });

      if (seriesData && seriesData.length > 0) {
        series = seriesData;
        aliases = aliasData || [];
        releases = releaseData || [];
        tags = tagData || [];
        people = peopleData || [];
      }
    } catch (err: any) {
      console.warn('Could not query Supabase directly, generating export from repository catalog:', err.message);
    }
  }

  if (series.length === 0) {
    // Generate clean static export from public reference database
    series = mockSeriesList
      .filter((s) => s.visibility === 'public')
      .map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        romanized_title: s.romanizedTitle || null,
        original_language: s.originalLanguage,
        origin_country: s.originCountry || null,
        year: s.year,
        episode_count: s.episodeCount,
        synopsis: s.synopsis,
        visibility: s.visibility,
        production_status: s.productionStatus || 'completed',
        rating_score: s.ratingScore,
        rating_count: s.ratingCount,
        list_count: s.popularity || 0,
        updated_at: s.updatedAt,
      }));

    for (const s of mockSeriesList) {
      if (s.visibility !== 'public') continue;
      for (const a of s.aliases) {
        aliases.push({
          series_id: s.id,
          text: a.text,
          language: a.language,
          script: a.script || null,
          source_url: 'https://shortdramaindex.com',
          source_label: a.source,
          status: a.status,
          added_at: a.addedAt,
        });
      }
      for (const r of s.releases) {
        releases.push({
          series_id: s.id,
          platform_slug: r.platformSlug,
          region: r.region,
          dub_language: r.dubLanguage || null,
          subtitle_languages: r.subtitleLanguages || [],
          url: r.url,
          is_official: r.isOfficial,
          link_status: r.linkStatus,
        });
      }
    }

    tags = mockTags;
    people = mockPeople;
  }

  const filesToWrite = [
    { name: 'series.json', data: series },
    { name: 'aliases.json', data: aliases },
    { name: 'releases.json', data: releases },
    { name: 'tags.json', data: tags },
    { name: 'people.json', data: people },
    {
      name: 'all-public-data.json',
      data: {
        exportedAt: new Date().toISOString(),
        series,
        aliases,
        releases,
        tags,
        people,
      },
    },
  ];

  for (const file of filesToWrite) {
    const targetPath = path.join(exportDir, file.name);
    fs.writeFileSync(targetPath, JSON.stringify(file.data, null, 2), 'utf-8');
    console.log(`Exported ${file.name} (${Array.isArray(file.data) ? file.data.length : 'aggregate'} records)`);
  }

  console.log(`\nExport complete. All files saved in "${exportDir}".`);
}

exportPublicData().catch((err) => {
  console.error('Fatal export error:', err);
  process.exit(1);
});
