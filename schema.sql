-- Lead Hunter database schema
-- Run this once in your Supabase project: Dashboard -> SQL Editor -> paste -> Run

create table if not exists leads (
  id                bigint generated always as identity primary key,
  source            text not null,              -- e.g. 'reddit', 'github', 'hackernews', 'mql5', 'forexfactory'
  external_id       text not null,               -- unique id of the post on that source
  title             text not null,
  description       text,
  url               text not null,
  category          text not null default 'other', -- 'trading' | 'web' | 'other'
  matched_keywords  text[] default '{}',
  contact_name      text,
  contact_email     text,
  contact_phone     text,
  author            text,
  posted_at         timestamptz,
  discovered_at     timestamptz not null default now(),
  status            text not null default 'new', -- 'new' | 'contacted' | 'quoted' | 'won' | 'lost' | 'ignored'
  notes             text,

  -- This is what makes "never add the same job twice" actually work:
  -- (source, external_id) must be unique, so re-inserting the same post
  -- on the next scraper run is a no-op (see scraper/lib/supabase.js upsert).
  unique (source, external_id)
);

create index if not exists idx_leads_posted_at on leads (posted_at desc);
create index if not exists idx_leads_status    on leads (status);
create index if not exists idx_leads_category  on leads (category);
create index if not exists idx_leads_source    on leads (source);

-- Row Level Security: the dashboard reads via the anon key (read-only),
-- the scraper writes via the service_role key (bypasses RLS automatically).
alter table leads enable row level security;

create policy "Public read access"
  on leads for select
  using (true);

create policy "Public status/notes update"
  on leads for update
  using (true)
  with check (true);

-- Optional: keep the table lean by hard-deleting anything older than 2 months.
-- The dashboard already filters these out, but this keeps the free-tier DB small.
-- You can run this manually, or schedule it with pg_cron if enabled on your project.
create or replace function purge_stale_leads() returns void as $$
  delete from leads
  where coalesce(posted_at, discovered_at) < now() - interval '60 days'
    and status in ('new', 'ignored');
$$ language sql;
