-- Lightweight anonymous product events for learning what people use.

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_analytics_events_name_created on public.analytics_events (event_name, created_at desc);

alter table public.analytics_events enable row level security;

create policy analytics_events_insert on public.analytics_events
  for insert with check (true);

-- Only admins can read (via security definer if needed later).
create policy analytics_events_select_admin on public.analytics_events
  for select using (public.is_app_admin());
