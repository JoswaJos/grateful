-- Already applied in the Supabase SQL Editor. Kept here as the source of truth.

-- USERS: one row per Clerk user
create table if not exists public.users (
  clerk_id      text primary key,
  email         text unique,
  name          text,
  image_url     text,
  reminder_time text,
  created_at    timestamptz not null default now()
);

-- ENTRIES: one gratitude entry per user per day
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references public.users(clerk_id) on delete cascade,
  item_1      text not null,
  item_2      text,
  item_3      text,
  mood        text,
  entry_date  date not null,
  created_at  timestamptz not null default now(),
  unique (user_id, entry_date)
);
create index if not exists entries_user_date_idx on public.entries (user_id, entry_date desc);

-- INSIGHTS: weekly AI summary per user
create table if not exists public.insights (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null references public.users(clerk_id) on delete cascade,
  week_start    date not null,
  themes        text[],
  summary       text,
  encouragement text,
  created_at    timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ROW LEVEL SECURITY: auth.jwt()->>'sub' is the Clerk user id
alter table public.users    enable row level security;
alter table public.entries  enable row level security;
alter table public.insights enable row level security;

create policy "users: own row" on public.users for all to authenticated
  using (clerk_id = (auth.jwt() ->> 'sub')) with check (clerk_id = (auth.jwt() ->> 'sub'));
create policy "entries: own rows" on public.entries for all to authenticated
  using (user_id = (auth.jwt() ->> 'sub')) with check (user_id = (auth.jwt() ->> 'sub'));
create policy "insights: own rows" on public.insights for all to authenticated
  using (user_id = (auth.jwt() ->> 'sub')) with check (user_id = (auth.jwt() ->> 'sub'));
