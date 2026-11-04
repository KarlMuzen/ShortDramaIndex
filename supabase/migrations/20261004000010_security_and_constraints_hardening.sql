-- 20261004000010_security_and_constraints_hardening.sql
--
-- Hardening pass: tighten over-permissive RLS policies, add the unique
-- constraints the importers already assume, and refresh apply_series_edits
-- for the new constraints. Run in the Supabase SQL Editor (this repo has no
-- DATABASE_URL; migrations are applied by hand, in filename order).
--
-- Live-data pre-checks (verified 2026-11-05 via the REST API, before this
-- migration was written): series slugs 60/60 unique, people slugs 15/15
-- unique, (series_id, platform_slug) release pairs 60/60 unique, so the
-- unique indexes below apply cleanly. If a future catalog state violates
-- one of them, resolve the duplicates first; the failing index will name
-- the offending rows.

-- ============================================================================
-- 1. Unique indexes (idempotent: safe to re-run)
-- ============================================================================

-- Series slugs are the public URL identity (/title/<slug>-<year>-<id>).
create unique index if not exists uq_series_slug
  on public.series (slug);

-- Person slugs are the public URL identity (/person/<slug>).
create unique index if not exists uq_people_slug
  on public.people (slug);

-- The importers assume one release per series per platform (the upsert key
-- is (series_id, platform_slug)); enforce it instead of assuming it.
create unique index if not exists uq_releases_series_platform
  on public.releases (series_id, platform_slug);

-- ============================================================================
-- 2. RLS policy fixes
-- ============================================================================

-- 2a. Aliases: any logged-in reader could previously insert an alias with
-- status = 'verified' and any added_by, minting trusted aliases without
-- review. Readers may now only propose pending aliases attributed to
-- themselves; editors and moderators keep full insert rights (this is the
-- path the moderator report-accept flow uses).
drop policy if exists "Logged in users, editors and mods can insert aliases"
  on public.aliases;
create policy "Logged in users, editors and mods can insert aliases"
  on public.aliases for insert
  with check (
    public.is_editor_or_mod(auth.uid())
    or (
      status = 'pending'
      and (added_by is null or added_by = auth.uid())
    )
  );

-- 2b. Reports: a reporter could previously insert a report already marked
-- 'accepted' or 'declined', bypassing moderation entirely. New reports are
-- always 'open'; only the moderator update policy can move them.
drop policy if exists "Logged in users can insert reports"
  on public.reports;
create policy "Logged in users can insert reports"
  on public.reports for insert
  with check (
    auth.uid() is not null
    and (submitted_by is null or submitted_by = auth.uid())
    and status = 'open'
  );

-- 2c. Revisions: an editor could previously attribute a revision to another
-- user. Revision authorship must now match the caller (or be null).
drop policy if exists "Editors and mods can insert revisions"
  on public.revisions;
create policy "Editors and mods can insert revisions"
  on public.revisions for insert
  with check (
    public.is_editor_or_mod(auth.uid())
    and (submitted_by is null or submitted_by = auth.uid())
  );

-- ============================================================================
-- 3. Updated apply_series_edits RPC
-- ============================================================================
-- Same signature and behaviour as 20261004000001, plus:
--   * the releases upsert is conflict-safe under uq_releases_series_platform
--     (a duplicate platform entry inside one edit is ignored instead of
--     aborting the whole transaction);
--   * the default alias source URL points at the real app domain
--     (shortdramaindex.vercel.app), not the unrelated .com site;
--   * EXECUTE is revoked from PUBLIC and granted to authenticated only.
--     The function is SECURITY DEFINER and enforces editor/mod itself, so
--     anonymous callers must not be able to invoke it at all.
create or replace function public.apply_series_edits(
  p_series_id bigint,
  p_summary text,
  p_details jsonb,
  p_aliases jsonb default '[]'::jsonb,
  p_releases jsonb default '[]'::jsonb,
  p_tags jsonb default '[]'::jsonb,
  p_diffs jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_revision_id uuid;
  v_alias jsonb;
  v_release jsonb;
  v_tag jsonb;
begin
  v_user_id := auth.uid();
  if v_user_id is null or not public.is_editor_or_mod(v_user_id) then
    raise exception 'Access denied: Only editors and moderators can edit catalog records.';
  end if;

  if length(p_summary) < 1 or length(p_summary) > 500 then
    raise exception 'Summary is required and must not exceed 500 characters.';
  end if;

  -- 1. Update series table
  update public.series
  set
    title = (p_details->>'title'),
    romanized_title = nullif(p_details->>'romanizedTitle', ''),
    original_language = (p_details->>'originalLanguage'),
    year = (p_details->>'year')::integer,
    episode_count = (p_details->>'episodeCount')::integer,
    synopsis = coalesce(p_details->>'synopsis', ''),
    production_status = coalesce(p_details->>'productionStatus', 'completed'),
    updated_at = now()
  where id = p_series_id;

  if not found then
    raise exception 'Series with ID % not found.', p_series_id;
  end if;

  -- 2. Update Aliases
  if jsonb_array_length(p_aliases) > 0 then
    delete from public.aliases where series_id = p_series_id;
    for v_alias in select * from jsonb_array_elements(p_aliases)
    loop
      insert into public.aliases (
        series_id,
        text,
        language,
        script,
        source_url,
        source_label,
        status,
        added_by,
        added_at
      ) values (
        p_series_id,
        (v_alias->>'text'),
        (v_alias->>'language'),
        nullif(v_alias->>'script', ''),
        coalesce(nullif(v_alias->>'sourceUrl', ''), 'https://shortdramaindex.vercel.app'),
        nullif(v_alias->>'source', ''),
        coalesce(nullif(v_alias->>'status', ''), 'verified'),
        v_user_id,
        now()
      )
      on conflict on constraint uq_series_language_alias do nothing;
    end loop;
  end if;

  -- 3. Update Releases
  if jsonb_array_length(p_releases) > 0 then
    delete from public.releases where series_id = p_series_id;
    for v_release in select * from jsonb_array_elements(p_releases)
    loop
      insert into public.releases (
        series_id,
        platform_slug,
        region,
        dub_language,
        episode_count,
        url,
        released_year,
        last_checked,
        link_status,
        is_official
      ) values (
        p_series_id,
        (v_release->>'platformSlug'),
        coalesce(nullif(v_release->>'region', ''), 'Global'),
        nullif(v_release->>'dubLanguage', ''),
        nullif(v_release->>'episodeCount', '')::integer,
        (v_release->>'url'),
        nullif(v_release->>'releasedYear', '')::integer,
        now(),
        coalesce(nullif(v_release->>'linkStatus', ''), 'active'),
        coalesce((v_release->>'isOfficial')::boolean, true)
      )
      on conflict (series_id, platform_slug) do nothing;
    end loop;
  end if;

  -- 4. Update Tags
  if jsonb_array_length(p_tags) > 0 then
    delete from public.series_tags where series_id = p_series_id;
    for v_tag in select * from jsonb_array_elements(p_tags)
    loop
      -- Ensure tag exists in tags table
      insert into public.tags (slug, name)
      values ((v_tag->>'slug'), (v_tag->>'name'))
      on conflict (slug) do nothing;

      insert into public.series_tags (series_id, tag_slug)
      values (p_series_id, (v_tag->>'slug'))
      on conflict do nothing;
    end loop;
  end if;

  -- 5. Insert Revision record
  insert into public.revisions (
    series_id,
    summary,
    diffs,
    submitted_by,
    created_at
  ) values (
    p_series_id,
    p_summary,
    p_diffs,
    v_user_id,
    now()
  )
  returning id into v_revision_id;

  return v_revision_id;
end;
$$;

revoke execute on function public.apply_series_edits(bigint, text, jsonb, jsonb, jsonb, jsonb, jsonb) from public;
grant execute on function public.apply_series_edits(bigint, text, jsonb, jsonb, jsonb, jsonb, jsonb) to authenticated;
