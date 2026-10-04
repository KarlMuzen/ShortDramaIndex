-- Database RPC function to atomically apply edits across series, aliases, releases, tags, and revisions

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
        coalesce(nullif(v_alias->>'sourceUrl', ''), 'https://shortdramaindex.com'),
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
      );
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
