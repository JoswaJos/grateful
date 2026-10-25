-- Schedules the weekly-digest Edge Function every Monday at 9:00 AM IST (03:30 UTC).
-- pg_cron = the scheduler, pg_net = lets Postgres make HTTP calls.
-- BEFORE RUNNING: replace YOUR_CRON_SECRET with the same value you set as the CRON_SECRET secret.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove an old schedule with the same name if re-running this file
select cron.unschedule('weekly-digest') where exists (select 1 from cron.job where jobname = 'weekly-digest');

select cron.schedule(
  'weekly-digest',
  '30 3 * * 1',  -- minute 30, hour 3 UTC, every Monday
  $$
  select net.http_post(
    url := 'https://uuujqrghjzrzwulpojon.supabase.co/functions/v1/weekly-digest',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', 'YOUR_CRON_SECRET'),
    body := '{}'::jsonb
  );
  $$
);
