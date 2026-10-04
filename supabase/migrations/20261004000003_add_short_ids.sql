-- Migration: Add unique short_id to series and people tables

-- 1. Helper to generate random 5-character base36 string ([a-z0-9]{5})
create or replace function public.generate_short_id()
returns text
language sql
volatile
as $$
  select lower(substring(md5(random()::text || clock_timestamp()::text) from 1 for 5));
$$;

-- 2. Add short_id column to series
alter table public.series 
add column if not exists short_id text unique default public.generate_short_id();

-- 3. Add short_id column to people
alter table public.people 
add column if not exists short_id text unique default public.generate_short_id();

-- 4. Backfill any existing series records where short_id is null
update public.series
set short_id = public.generate_short_id()
where short_id is null;

-- 5. Backfill any existing people records where short_id is null
update public.people
set short_id = public.generate_short_id()
where short_id is null;

-- 6. Enforce not null constraint
alter table public.series alter column short_id set not null;
alter table public.people alter column short_id set not null;

-- 7. Create index on short_id for fast lookup
create index if not exists idx_series_short_id on public.series(short_id);
create index if not exists idx_people_short_id on public.people(short_id);
