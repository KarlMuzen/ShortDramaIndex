-- Migration: Add unique short_id to series and people tables

-- 1. Helper to generate random 5-character base36 string ([a-z0-9]{5})
create or replace function public.generate_short_id()
returns text
language sql
volatile
as $$
  select lower(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
$$;

-- 2. Add short_id column to series table
alter table public.series
  add column if not exists short_id text unique check (length(short_id) = 5 and short_id ~ '^[a-z0-9]{5}$');

-- Backfill existing series rows with random 5-char short IDs if null
update public.series
set short_id = public.generate_short_id()
where short_id is null;

-- Make short_id not null with default for new rows
alter table public.series
  alter column short_id set default public.generate_short_id(),
  alter column short_id set not null;

create index if not exists idx_series_short_id on public.series (short_id);

-- 3. Add short_id column to people table
alter table public.people
  add column if not exists short_id text unique check (length(short_id) = 5 and short_id ~ '^[a-z0-9]{5}$');

-- Backfill existing people rows with random 5-char short IDs if null
update public.people
set short_id = public.generate_short_id()
where short_id is null;

-- Make short_id not null with default for new rows
alter table public.people
  alter column short_id set default public.generate_short_id(),
  alter column short_id set not null;

create index if not exists idx_people_short_id on public.people (short_id);
