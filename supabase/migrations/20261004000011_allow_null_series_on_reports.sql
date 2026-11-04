-- 20261004000011_allow_null_series_on_reports.sql
--
-- Missing-drama requests are series-less by design: the requested drama is
-- not in the catalog yet, so submitMissingDramaRequestAction inserts a
-- report with series_id NULL and the request details in data. The column
-- was NOT NULL since the initial schema, so those inserts failed until
-- this migration is run in the Supabase SQL Editor.
-- Existing rows are unaffected; the foreign key still applies whenever a
-- series_id is present.
alter table public.reports alter column series_id drop not null;
