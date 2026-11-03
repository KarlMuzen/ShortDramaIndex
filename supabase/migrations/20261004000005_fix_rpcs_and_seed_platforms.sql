-- Fix search_series: return short_id (fixes "short_id missing in select" in repository.ts),
-- create the missing resolve_title_redirect RPC, and seed real platforms + core tropes.
-- This recreates 20261004000002_search_series_function.sql with short_id added.

drop function if exists public.search_series(text, jsonb, text, integer, integer);

create or replace function public.search_series(
  p_q text default '',
  p_filters jsonb default '{}'::jsonb,
  p_sort text default 'relevance',
  p_page integer default 1,
  p_page_size integer default 10
)
returns table (
  id bigint,
  short_id text,
  slug text,
  title text,
  romanized_title text,
  original_language text,
  year integer,
  episode_count integer,
  poster_url text,
  synopsis text,
  rating_score numeric,
  rating_count integer,
  list_count integer,
  matched_field text,
  matched_alias_text text,
  matched_alias_language text,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_q text;
  v_page integer;
  v_limit integer;
  v_offset integer;
  v_filter_platform text;
  v_filter_lang text;
  v_filter_tag text;
  v_filter_year integer;
  v_filter_status text;
  v_filter_ep_range text;
begin
  -- Validate and clamp inputs
  if length(p_q) > 100 then
    raise exception 'Query must not exceed 100 characters.';
  end if;

  v_q := trim(lower(p_q));
  v_page := greatest(1, p_page);
  v_limit := least(24, greatest(1, p_page_size));
  v_offset := (v_page - 1) * v_limit;

  v_filter_platform := nullif(p_filters->>'platform', '');
  v_filter_lang := nullif(p_filters->>'language', '');
  v_filter_tag := nullif(p_filters->>'tag', '');
  v_filter_year := nullif(p_filters->>'year', '')::integer;
  v_filter_status := nullif(p_filters->>'status', '');
  v_filter_ep_range := nullif(p_filters->>'episodeRange', '');

  return query
  with base_matches as (
    select
      s.id as s_id,
      s.short_id as s_short_id,
      s.slug as s_slug,
      s.title as s_title,
      s.romanized_title as s_romanized_title,
      s.original_language as s_original_language,
      s.year as s_year,
      s.episode_count as s_episode_count,
      s.poster_url as s_poster_url,
      s.synopsis as s_synopsis,
      s.rating_score as s_rating_score,
      s.rating_count as s_rating_count,
      s.list_count as s_list_count,
      -- Matching priority
      case
        when v_q = '' then 'browse'
        when lower(s.title) = v_q then 'title'
        when lower(coalesce(s.romanized_title, '')) = v_q then 'romanized'
        when best_alias.text is not null and lower(best_alias.text) = v_q then 'alias'
        when lower(s.title) like v_q || '%' then 'title'
        when lower(coalesce(s.romanized_title, '')) like v_q || '%' then 'romanized'
        when best_alias.text is not null and lower(best_alias.text) like v_q || '%' then 'alias'
        when lower(s.title) like '%' || v_q || '%' then 'title'
        when lower(coalesce(s.romanized_title, '')) like '%' || v_q || '%' then 'romanized'
        when best_alias.text is not null then 'alias'
        else null
      end as match_field,
      best_alias.text as match_alias_text,
      best_alias.language as match_alias_lang,
      -- Ranking score
      case
        when v_q = '' then 4
        when lower(s.title) = v_q or (best_alias.text is not null and lower(best_alias.text) = v_q) then 1
        when lower(s.title) like v_q || '%' or (best_alias.text is not null and lower(best_alias.text) like v_q || '%') then 2
        else 3
      end as rank_tier
    from public.series s
    left join lateral (
      select a.text, a.language
      from public.aliases a
      where a.series_id = s.id
        and v_q <> ''
        and lower(a.text) like '%' || v_q || '%'
      order by
        case
          when lower(a.text) = v_q then 1
          when lower(a.text) like v_q || '%' then 2
          else 3
        end
      limit 1
    ) best_alias on true
    where s.visibility = 'public'
      and (
        v_q = ''
        or lower(s.title) like '%' || v_q || '%'
        or lower(coalesce(s.romanized_title, '')) like '%' || v_q || '%'
        or best_alias.text is not null
      )
      -- Platform filter
      and (
        v_filter_platform is null
        or exists (
          select 1 from public.releases r
          where r.series_id = s.id and r.platform_slug = v_filter_platform
        )
      )
      -- Language filter
      and (
        v_filter_lang is null
        or s.original_language = v_filter_lang
        or exists (
          select 1 from public.aliases al
          where al.series_id = s.id and al.language = v_filter_lang
        )
      )
      -- Tag filter
      and (
        v_filter_tag is null
        or exists (
          select 1 from public.series_tags st
          where st.series_id = s.id and st.tag_slug = v_filter_tag
        )
      )
      -- Year filter
      and (
        v_filter_year is null or s.year = v_filter_year
      )
      -- Status filter
      and (
        v_filter_status is null or s.production_status = v_filter_status
      )
      -- Episode Range filter
      and (
        v_filter_ep_range is null
        or (v_filter_ep_range = '<50' and s.episode_count < 50)
        or (v_filter_ep_range = '50-80' and s.episode_count between 50 and 80)
        or (v_filter_ep_range = '80+' and s.episode_count > 80)
      )
  ),
  counted as (
    select count(*) as full_count from base_matches
  )
  select
    bm.s_id as id,
    bm.s_short_id as short_id,
    bm.s_slug as slug,
    bm.s_title as title,
    bm.s_romanized_title as romanized_title,
    bm.s_original_language as original_language,
    bm.s_year as year,
    bm.s_episode_count as episode_count,
    bm.s_poster_url as poster_url,
    bm.s_synopsis as synopsis,
    bm.s_rating_score as rating_score,
    bm.s_rating_count as rating_count,
    bm.s_list_count as list_count,
    coalesce(bm.match_field, 'title') as matched_field,
    bm.match_alias_text as matched_alias_text,
    bm.match_alias_lang as matched_alias_language,
    c.full_count as total_count
  from base_matches bm
  cross join counted c
  order by
    case when p_sort = 'newest' then bm.s_year end desc nulls last,
    case when p_sort = 'rating' then bm.s_rating_score end desc nulls last,
    case when p_sort = 'title' then bm.s_title end asc nulls last,
    case when p_sort = 'popularity' then bm.s_list_count end desc nulls last,
    -- Default 'relevance' sort: rank tier first, then popularity
    bm.rank_tier asc,
    bm.s_list_count desc,
    bm.s_rating_count desc,
    bm.s_id desc
  limit v_limit
  offset v_offset;
end;
$$;

-- Missing RPC used by repository.ts checkRedirect(): look up a redirect by series short_id.
create or replace function public.resolve_title_redirect(p_short_id text)
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select r.to_id
  from public.redirects r
  join public.series s on s.id = r.from_id
  where lower(s.short_id) = lower(p_short_id)
  limit 1;
$$;

-- Seed real platforms (replacing fake placeholder platforms).
insert into public.platforms (slug, name, url) values
  ('reelshort', 'ReelShort', 'https://www.reelshort.com'),
  ('dramabox', 'DramaBox', 'https://www.dramaboxapp.com'),
  ('shortmax', 'ShortMax', 'https://www.shortmax.com'),
  ('kalos-tv', 'Kalos TV', 'https://www.kalostv.com'),
  ('goodshort', 'GoodShort', 'https://www.goodshort.com'),
  ('netshort', 'NetShort', 'https://www.netshort.com'),
  ('flextv', 'FlexTV', 'https://www.flextv.cc'),
  ('youtube', 'YouTube', 'https://www.youtube.com')
on conflict (slug) do update set
  name = excluded.name,
  url = excluded.url;

-- Seed core English mini-drama tropes.
insert into public.tags (slug, name) values
  ('contract-marriage', 'Contract Marriage'),
  ('secret-billionaire', 'Secret Billionaire'),
  ('ceo-romance', 'CEO Romance'),
  ('hidden-identity', 'Hidden Identity'),
  ('revenge', 'Revenge'),
  ('second-chance', 'Second Chance'),
  ('werewolf-alpha', 'Werewolf Alpha'),
  ('mafia-romance', 'Mafia Romance'),
  ('single-mom', 'Single Mom'),
  ('mistaken-identity', 'Mistaken Identity'),
  ('enemies-to-lovers', 'Enemies to Lovers'),
  ('flash-marriage', 'Flash Marriage')
on conflict (slug) do nothing;
