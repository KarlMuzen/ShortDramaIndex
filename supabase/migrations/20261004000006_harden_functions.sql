-- Migration 000006: pin the search path of the short id functions, and stop trigger-only
-- functions from being callable through the public API (triggers still run them).

alter function public.generate_short_id(text, text) set search_path = public;
alter function public.generate_series_short_id() set search_path = public;
alter function public.generate_people_short_id() set search_path = public;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.update_series_stats() from public, anon, authenticated;
