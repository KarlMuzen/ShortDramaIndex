-- Removes the example data created by supabase/seed.sql. Run this BEFORE real data is added.
-- (It deletes tags by slug, so it would also strip those tags from real titles.)

delete from public.redirects
where from_id in (select id from public.series where slug = 'heiress-reborn-revenge-duplicate');

-- Cascades to aliases, releases, tag links, cast links, reports and revisions
delete from public.series where slug in (
  'reborn-heiress-strikes-back',
  'billionaires-secret-fiancee',
  'tycoons-discarded-ex-wife',
  'midnight-boardroom-romance',
  'accidental-empress-in-metropolis',
  'billionaire-undercover',
  'twin-heirs-swap-destiny',
  'whispers-of-the-shadow-heir',
  'loop-of-the-last-summer',
  'contract-marriage-with-the-rival-ceo',
  'heiress-reborn-revenge-duplicate'
);

delete from public.people where slug in (
  'su-wanqing', 'gu-mingzhe', 'lin-chuyan', 'han-seoyun', 'mori-haruka', 'diego-ramirez-vela'
);

delete from public.platforms where slug in ('lumen-tv', 'reelway', 'shortline', 'youtube');

delete from public.tags where slug in (
  'ceo-romance', 'hidden-identity', 'contract-marriage', 'revenge',
  'second-chance', 'urban-fantasy', 'family-drama', 'time-loop'
);
