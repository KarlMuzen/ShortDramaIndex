-- Allow local poster assets (/posters/*.webp served from public/posters/) in
-- addition to external http(s) poster URLs. Previously series.poster_url
-- only accepted ^https?://, so the enriched batch-1 poster paths were
-- rejected with "violates check constraint series_poster_url_check" (23514).
-- Safe: existing external URLs still pass; only /posters/ paths are added.

alter table public.series drop constraint if exists series_poster_url_check;

alter table public.series add constraint series_poster_url_check
  check (
    poster_url is null
    or (
      (poster_url ~ '^https?://' or poster_url ~ '^/posters/')
      and length(poster_url) <= 1000
    )
  );
