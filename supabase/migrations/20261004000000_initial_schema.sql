-- Extension for fuzzy text search and tri-gram index matching
create extension if not exists pg_trgm;

-- 1. Profiles Table (linked to Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null check (length(handle) between 3 and 50 and handle ~ '^[a-zA-Z0-9_]+$'),
  display_name text not null check (length(display_name) between 1 and 200),
  role text not null default 'reader' check (role in ('reader', 'editor', 'moderator')),
  avatar_url text check (avatar_url is null or (avatar_url ~ '^https?://' and length(avatar_url) <= 1000)),
  joined_at timestamptz not null default now()
);

-- 2. Series Table
create table public.series (
  id bigint generated always as identity primary key,
  slug text not null check (length(slug) between 1 and 250),
  title text not null check (length(title) between 1 and 200),
  romanized_title text check (romanized_title is null or length(romanized_title) <= 200),
  original_language text not null check (length(original_language) between 2 and 10),
  origin_country text check (origin_country is null or length(origin_country) between 2 and 10),
  year integer not null check (year between 1900 and 2100),
  episode_count integer not null check (episode_count >= 1),
  avg_episode_minutes integer check (avg_episode_minutes is null or avg_episode_minutes >= 1),
  synopsis text not null default '' check (length(synopsis) <= 4000),
  poster_url text check (poster_url is null or (poster_url ~ '^https?://' and length(poster_url) <= 1000)),
  production_status text not null default 'completed' check (production_status in ('completed', 'ongoing')),
  visibility text not null default 'public' check (visibility in ('public', 'hidden', 'removed')),
  rating_score numeric(3, 1) not null default 0.0 check (rating_score between 0.0 and 10.0),
  rating_count integer not null default 0 check (rating_count >= 0),
  list_count integer not null default 0 check (list_count >= 0),
  updated_at timestamptz not null default now()
);

-- 3. Aliases Table
create table public.aliases (
  id uuid primary key default gen_random_uuid(),
  series_id bigint not null references public.series(id) on delete cascade,
  text text not null check (length(text) between 1 and 200),
  language text not null check (length(language) between 2 and 10),
  script text check (script is null or length(script) <= 20),
  source_url text not null check (source_url ~ '^https?://' and length(source_url) <= 1000),
  source_label text check (source_label is null or length(source_label) <= 100),
  status text not null default 'pending' check (status in ('verified', 'pending', 'disputed')),
  added_by uuid references public.profiles(id) on delete set null,
  added_at timestamptz not null default now(),
  constraint uq_series_language_alias unique (series_id, language, lower(text))
);

-- 4. Platforms Table
create table public.platforms (
  slug text primary key check (length(slug) between 1 and 100),
  name text not null check (length(name) between 1 and 200),
  url text not null check (url ~ '^https?://' and length(url) <= 1000),
  icon text check (icon is null or length(icon) <= 100),
  is_official boolean not null default true,
  description text check (description is null or length(description) <= 1000)
);

-- 5. Releases Table
create table public.releases (
  id uuid primary key default gen_random_uuid(),
  series_id bigint not null references public.series(id) on delete cascade,
  platform_slug text not null references public.platforms(slug) on delete restrict,
  region text not null default 'Global' check (length(region) <= 50),
  dub_language text check (dub_language is null or length(dub_language) <= 10),
  subtitle_languages text[] not null default '{}',
  episode_count integer check (episode_count is null or episode_count >= 1),
  url text not null check (url ~ '^https?://' and length(url) <= 1000),
  released_year integer check (released_year is null or released_year between 1900 and 2100),
  last_checked timestamptz not null default now(),
  link_status text not null default 'active' check (link_status in ('active', 'broken', 'unverified', 'disputed')),
  is_official boolean not null default true
);

-- 6. Tags Table
create table public.tags (
  slug text primary key check (length(slug) between 1 and 100),
  name text not null check (length(name) between 1 and 100)
);

-- 7. Series Tags Table
create table public.series_tags (
  series_id bigint not null references public.series(id) on delete cascade,
  tag_slug text not null references public.tags(slug) on delete cascade,
  primary key (series_id, tag_slug)
);

-- 8. People Table
create table public.people (
  id bigint generated always as identity primary key,
  slug text not null check (length(slug) between 1 and 200),
  name text not null check (length(name) between 1 and 200),
  native_name text check (native_name is null or length(native_name) <= 200)
);

-- 9. Series People Table
create table public.series_people (
  series_id bigint not null references public.series(id) on delete cascade,
  person_id bigint not null references public.people(id) on delete cascade,
  role_type text not null check (role_type in ('actor', 'director', 'writer', 'producer', 'crew')),
  character_name text check (character_name is null or length(character_name) <= 200),
  primary key (series_id, person_id, role_type)
);

-- 10. List Entries Table
create table public.list_entries (
  user_id uuid not null references public.profiles(id) on delete cascade,
  series_id bigint not null references public.series(id) on delete cascade,
  status text not null check (status in ('watching', 'plan_to_watch', 'completed', 'dropped', 'on_hold')),
  score smallint check (score is null or (score >= 1 and score <= 10)),
  episodes_watched integer not null default 0 check (episodes_watched >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, series_id)
);

-- 11. Reports Table
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  series_id bigint not null references public.series(id) on delete cascade,
  type text not null check (type in ('another_name', 'wrong_name', 'same_drama', 'not_same_drama', 'wrong_details', 'broken_link', 'other')),
  status text not null default 'open' check (status in ('open', 'accepted', 'declined')),
  submitted_by uuid references public.profiles(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  moderator_note text check (moderator_note is null or length(moderator_note) <= 1000),
  created_at timestamptz not null default now()
);

-- 12. Revisions Table
create table public.revisions (
  id uuid primary key default gen_random_uuid(),
  series_id bigint not null references public.series(id) on delete cascade,
  summary text not null check (length(summary) <= 500),
  diffs jsonb not null default '[]'::jsonb,
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  reverted boolean not null default false
);

-- 13. Redirects Table
create table public.redirects (
  from_id bigint primary key,
  to_id bigint not null references public.series(id) on delete cascade,
  reason text check (reason is null or length(reason) <= 500),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Tri-gram GIN indexes for fast multilingual search
create index idx_aliases_text_trgm on public.aliases using gin (lower(text) gin_trgm_ops);
create index idx_series_title_trgm on public.series using gin (lower(title) gin_trgm_ops);
create index idx_series_romanized_title_trgm on public.series using gin (lower(romanized_title) gin_trgm_ops);

-- B-Tree indexes on every foreign key
create index idx_aliases_series_id on public.aliases (series_id);
create index idx_aliases_added_by on public.aliases (added_by);
create index idx_releases_series_id on public.releases (series_id);
create index idx_releases_platform_slug on public.releases (platform_slug);
create index idx_series_tags_series_id on public.series_tags (series_id);
create index idx_series_tags_tag_slug on public.series_tags (tag_slug);
create index idx_series_people_series_id on public.series_people (series_id);
create index idx_series_people_person_id on public.series_people (person_id);
create index idx_list_entries_user_id on public.list_entries (user_id);
create index idx_list_entries_series_id on public.list_entries (series_id);
create index idx_reports_series_id on public.reports (series_id);
create index idx_reports_submitted_by on public.reports (submitted_by);
create index idx_revisions_series_id on public.revisions (series_id);
create index idx_revisions_submitted_by on public.revisions (submitted_by);
create index idx_redirects_to_id on public.redirects (to_id);

-- B-Tree indexes on series for visibility, slug, and rankings
create index idx_series_slug on public.series (slug);
create index idx_series_visibility_popularity on public.series (visibility, list_count desc);
create index idx_series_visibility_rating on public.series (visibility, rating_score desc);

-- ============================================================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- ============================================================================

create or replace function public.is_editor_or_mod(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user_id and role in ('editor', 'moderator')
  );
$$;

create or replace function public.is_moderator(check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user_id and role = 'moderator'
  );
$$;

-- Secure function allowing only moderators to change user roles
create or replace function public.set_user_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_moderator(auth.uid()) then
    raise exception 'Access denied: Only moderators can update user roles.';
  end if;

  if new_role not in ('reader', 'editor', 'moderator') then
    raise exception 'Invalid role: must be reader, editor, or moderator.';
  end if;

  update public.profiles
  set role = new_role
  where id = target_user_id;
end;
$$;

-- Automatic profile provision on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, handle, display_name, role, joined_at)
  values (
    new.id,
    coalesce(nullif(lower(regexp_replace(new.raw_user_meta_data->>'handle', '[^a-z0-9_]', '', 'g')), ''), 'user_' || substr(new.id::text, 1, 8)),
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), 'Reader'),
    'reader',
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- STATS TRIGGER (Rating Score, Count, List Count)
-- ============================================================================

create or replace function public.update_series_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_series_id bigint;
  avg_score numeric(3, 1);
  cnt_score integer;
  cnt_list integer;
begin
  if (TG_OP = 'DELETE') then
    target_series_id := OLD.series_id;
  else
    target_series_id := NEW.series_id;
  end if;

  select
    coalesce(round(avg(score)::numeric, 1), 0.0),
    count(score),
    count(*)
  into
    avg_score,
    cnt_score,
    cnt_list
  from public.list_entries
  where series_id = target_series_id;

  update public.series
  set
    rating_score = avg_score,
    rating_count = cnt_score,
    list_count = cnt_list,
    updated_at = now()
  where id = target_series_id;

  return null;
end;
$$;

create trigger trg_list_entries_stats
  after insert or update or delete on public.list_entries
  for each row execute function public.update_series_stats();

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- 1. Profiles RLS
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile display_name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

-- 2. Series RLS
alter table public.series enable row level security;

create policy "Anyone can read public series"
  on public.series for select
  using (visibility = 'public' or public.is_editor_or_mod(auth.uid()));

create policy "Editors and mods can insert series"
  on public.series for insert
  with check (public.is_editor_or_mod(auth.uid()));

create policy "Editors and mods can update series"
  on public.series for update
  using (public.is_editor_or_mod(auth.uid()))
  with check (public.is_editor_or_mod(auth.uid()));

create policy "Moderators can delete series"
  on public.series for delete
  using (public.is_moderator(auth.uid()));

-- 3. Aliases RLS
alter table public.aliases enable row level security;

create policy "Anyone can read aliases of visible series"
  on public.aliases for select
  using (
    exists (
      select 1 from public.series s
      where s.id = aliases.series_id
      and (s.visibility = 'public' or public.is_editor_or_mod(auth.uid()))
    )
  );

create policy "Logged in users, editors and mods can insert aliases"
  on public.aliases for insert
  with check (auth.uid() is not null);

create policy "Editors and mods can update aliases"
  on public.aliases for update
  using (public.is_editor_or_mod(auth.uid()))
  with check (public.is_editor_or_mod(auth.uid()));

create policy "Editors and mods can delete aliases"
  on public.aliases for delete
  using (public.is_editor_or_mod(auth.uid()));

-- 4. Platforms RLS
alter table public.platforms enable row level security;

create policy "Anyone can read platforms"
  on public.platforms for select
  using (true);

create policy "Editors and mods can write platforms"
  on public.platforms for all
  using (public.is_editor_or_mod(auth.uid()))
  with check (public.is_editor_or_mod(auth.uid()));

-- 5. Releases RLS
alter table public.releases enable row level security;

create policy "Anyone can read releases of visible series"
  on public.releases for select
  using (
    exists (
      select 1 from public.series s
      where s.id = releases.series_id
      and (s.visibility = 'public' or public.is_editor_or_mod(auth.uid()))
    )
  );

create policy "Editors and mods can insert releases"
  on public.releases for insert
  with check (public.is_editor_or_mod(auth.uid()));

create policy "Editors and mods can update releases"
  on public.releases for update
  using (public.is_editor_or_mod(auth.uid()))
  with check (public.is_editor_or_mod(auth.uid()));

create policy "Editors and mods can delete releases"
  on public.releases for delete
  using (public.is_editor_or_mod(auth.uid()));

-- 6. Tags RLS
alter table public.tags enable row level security;

create policy "Anyone can read tags"
  on public.tags for select
  using (true);

create policy "Editors and mods can write tags"
  on public.tags for all
  using (public.is_editor_or_mod(auth.uid()))
  with check (public.is_editor_or_mod(auth.uid()));

-- 7. Series Tags RLS
alter table public.series_tags enable row level security;

create policy "Anyone can read series_tags"
  on public.series_tags for select
  using (
    exists (
      select 1 from public.series s
      where s.id = series_tags.series_id
      and (s.visibility = 'public' or public.is_editor_or_mod(auth.uid()))
    )
  );

create policy "Editors and mods can write series_tags"
  on public.series_tags for all
  using (public.is_editor_or_mod(auth.uid()))
  with check (public.is_editor_or_mod(auth.uid()));

-- 8. People RLS
alter table public.people enable row level security;

create policy "Anyone can read people"
  on public.people for select
  using (true);

create policy "Editors and mods can insert people"
  on public.people for insert
  with check (public.is_editor_or_mod(auth.uid()));

create policy "Editors and mods can update people"
  on public.people for update
  using (public.is_editor_or_mod(auth.uid()))
  with check (public.is_editor_or_mod(auth.uid()));

create policy "Editors and mods can delete people"
  on public.people for delete
  using (public.is_editor_or_mod(auth.uid()));

-- 9. Series People RLS
alter table public.series_people enable row level security;

create policy "Anyone can read series_people"
  on public.series_people for select
  using (
    exists (
      select 1 from public.series s
      where s.id = series_people.series_id
      and (s.visibility = 'public' or public.is_editor_or_mod(auth.uid()))
    )
  );

create policy "Editors and mods can write series_people"
  on public.series_people for all
  using (public.is_editor_or_mod(auth.uid()))
  with check (public.is_editor_or_mod(auth.uid()));

-- 10. List Entries RLS
alter table public.list_entries enable row level security;

create policy "List entries are viewable by everyone"
  on public.list_entries for select
  using (true);

create policy "Users can insert own list entries"
  on public.list_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own list entries"
  on public.list_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own list entries"
  on public.list_entries for delete
  using (auth.uid() = user_id);

-- 11. Reports RLS
alter table public.reports enable row level security;

create policy "Users read own reports, moderators read all"
  on public.reports for select
  using (auth.uid() = submitted_by or public.is_moderator(auth.uid()));

create policy "Logged in users can insert reports"
  on public.reports for insert
  with check (auth.uid() is not null and (submitted_by is null or submitted_by = auth.uid()));

create policy "Moderators can update reports"
  on public.reports for update
  using (public.is_moderator(auth.uid()))
  with check (public.is_moderator(auth.uid()));

create policy "Moderators can delete reports"
  on public.reports for delete
  using (public.is_moderator(auth.uid()));

-- 12. Revisions RLS
alter table public.revisions enable row level security;

create policy "Anyone can read revisions"
  on public.revisions for select
  using (true);

create policy "Editors and mods can insert revisions"
  on public.revisions for insert
  with check (public.is_editor_or_mod(auth.uid()));

create policy "Moderators can update revisions"
  on public.revisions for update
  using (public.is_moderator(auth.uid()))
  with check (public.is_moderator(auth.uid()));

create policy "Moderators can delete revisions"
  on public.revisions for delete
  using (public.is_moderator(auth.uid()));

-- 13. Redirects RLS
alter table public.redirects enable row level security;

create policy "Anyone can read redirects"
  on public.redirects for select
  using (true);

create policy "Editors and mods can write redirects"
  on public.redirects for all
  using (public.is_editor_or_mod(auth.uid()))
  with check (public.is_editor_or_mod(auth.uid()));
