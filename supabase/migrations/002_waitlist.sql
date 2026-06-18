-- Waitlist: join before sign-up; only approved emails may create a session.

create type public.waitlist_status as enum ('pending', 'approved', 'rejected');

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  status public.waitlist_status not null default 'pending',
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  constraint waitlist_entries_email_unique unique (email)
);

create index idx_waitlist_entries_email_lower on public.waitlist_entries (lower(email));
create index idx_waitlist_entries_status on public.waitlist_entries (status);

alter table public.waitlist_entries enable row level security;

-- No direct table access for clients; use RPCs below.

create or replace function public.normalize_email(raw_email text)
returns text
language sql
immutable
as $$
  select lower(trim(raw_email));
$$;

create or replace function public.join_waitlist(raw_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := public.normalize_email(raw_email);
  existing public.waitlist_entries%rowtype;
begin
  if normalized is null or normalized = '' or position('@' in normalized) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Enter a valid email address.');
  end if;

  select * into existing from public.waitlist_entries where email = normalized;

  if found then
    return jsonb_build_object(
      'ok', true,
      'status', existing.status,
      'already_joined', true
    );
  end if;

  insert into public.waitlist_entries (email, status)
  values (normalized, 'pending');

  return jsonb_build_object(
    'ok', true,
    'status', 'pending',
    'already_joined', false
  );
end;
$$;

create or replace function public.get_waitlist_status(raw_email text)
returns public.waitlist_status
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := public.normalize_email(raw_email);
  found_status public.waitlist_status;
begin
  if normalized is null or normalized = '' then
    return null;
  end if;

  -- Existing auth users are always allowed (grandfathered accounts).
  if exists (
    select 1 from auth.users u where lower(u.email) = normalized
  ) then
    return 'approved';
  end if;

  select status into found_status
  from public.waitlist_entries
  where email = normalized;

  return found_status;
end;
$$;

create or replace function public.is_waitlist_approved(raw_email text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.get_waitlist_status(raw_email) = 'approved';
$$;

grant execute on function public.join_waitlist(text) to anon, authenticated;
grant execute on function public.get_waitlist_status(text) to anon, authenticated;
grant execute on function public.is_waitlist_approved(text) to anon, authenticated;
