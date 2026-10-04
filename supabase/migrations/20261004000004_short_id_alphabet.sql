-- Migration: Base36 short_id generator with collision retry

create or replace function public.generate_short_id(table_name text default null, id_column text default 'short_id')
returns text
language plpgsql
volatile
as $$
declare
  chars text := '0123456789abcdefghijklmnopqrstuvwxyz';
  result text := '';
  i integer;
  attempts integer := 0;
  exists_count integer;
begin
  loop
    attempts := attempts + 1;
    result := '';
    for i in 1..5 loop
      result := result || substr(chars, floor(random() * 36)::integer + 1, 1);
    end loop;

    -- If no table provided, return the 5-char base36 string directly
    if table_name is null then
      return result;
    end if;

    -- Check for collision in specified table
    execute format('select count(1) from %I where %I = %L', table_name, id_column, result) into exists_count;
    if exists_count = 0 then
      return result;
    end if;

    -- Safety breakout after 100 collision attempts
    if attempts >= 100 then
      return result || substr(chars, floor(random() * 36)::integer + 1, 1);
    end if;
  end loop;
end;
$$;

-- Update defaults for series and people
create or replace function public.generate_series_short_id()
returns trigger
language plpgsql
as $$
begin
  if new.short_id is null or length(trim(new.short_id)) = 0 then
    new.short_id := public.generate_short_id('series', 'short_id');
  end if;
  return new;
end;
$$;

create or replace function public.generate_people_short_id()
returns trigger
language plpgsql
as $$
begin
  if new.short_id is null or length(trim(new.short_id)) = 0 then
    new.short_id := public.generate_short_id('people', 'short_id');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_series_short_id on public.series;
create trigger trg_series_short_id
before insert on public.series
for each row execute function public.generate_series_short_id();

drop trigger if exists trg_people_short_id on public.people;
create trigger trg_people_short_id
before insert on public.people
for each row execute function public.generate_people_short_id();
