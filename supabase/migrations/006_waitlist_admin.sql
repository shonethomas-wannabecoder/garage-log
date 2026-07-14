-- Waitlist admin RPCs (seed your admin email below).

create table if not exists public.app_admins (
  email text primary key
);

alter table public.app_admins enable row level security;

-- No client read/write; only used inside security definer functions.
create policy app_admins_deny on public.app_admins for all using (false);

insert into public.app_admins (email)
values ('shone.thomas@utexas.edu')
on conflict (email) do nothing;

create or replace function public.is_app_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.app_admins a
    where a.email = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );
$$;

create or replace function public.list_waitlist_entries()
returns table (
  id uuid,
  email text,
  status public.waitlist_status,
  created_at timestamptz,
  approved_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select w.id, w.email, w.status, w.created_at, w.approved_at
  from public.waitlist_entries w
  order by w.created_at desc;
end;
$$;

create or replace function public.set_waitlist_status(entry_id uuid, next_status public.waitlist_status)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    return jsonb_build_object('ok', false, 'error', 'Not authorized');
  end if;

  update public.waitlist_entries
  set
    status = next_status,
    approved_at = case when next_status = 'approved' then coalesce(approved_at, now()) else approved_at end
  where id = entry_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Entry not found');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.is_app_admin() to authenticated;
grant execute on function public.list_waitlist_entries() to authenticated;
grant execute on function public.set_waitlist_status(uuid, public.waitlist_status) to authenticated;
