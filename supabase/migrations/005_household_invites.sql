-- Household email invites.

create type public.invite_status as enum ('pending', 'accepted', 'revoked');

create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users (id) on delete cascade,
  status public.invite_status not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint household_invites_email_unique unique (household_id, email)
);

create index idx_household_invites_email_lower on public.household_invites (lower(email));
create index idx_household_invites_household on public.household_invites (household_id);

alter table public.household_invites enable row level security;

create policy household_invites_select on public.household_invites
  for select using (
    public.is_household_member(household_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy household_invites_insert on public.household_invites
  for insert with check (
    public.is_household_member(household_id)
  );

create policy household_invites_update on public.household_invites
  for update using (
    public.is_household_member(household_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create or replace function public.normalize_invite_email(raw_email text)
returns text
language sql
immutable
as $$
  select lower(trim(raw_email));
$$;

create or replace function public.invite_household_member(raw_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := public.normalize_invite_email(raw_email);
  hid uuid;
  existing public.household_invites%rowtype;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'Sign in required.');
  end if;

  if normalized is null or normalized = '' or position('@' in normalized) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Enter a valid email address.');
  end if;

  select household_id into hid
  from public.household_members
  where user_id = auth.uid()
  limit 1;

  if hid is null then
    return jsonb_build_object('ok', false, 'error', 'No household found.');
  end if;

  if exists (
    select 1 from public.household_members hm
    join auth.users u on u.id = hm.user_id
    where hm.household_id = hid and lower(u.email) = normalized
  ) then
    return jsonb_build_object('ok', false, 'error', 'That person is already a member.');
  end if;

  select * into existing
  from public.household_invites
  where household_id = hid and email = normalized;

  if found and existing.status = 'pending' then
    return jsonb_build_object('ok', true, 'already_invited', true);
  end if;

  if found then
    update public.household_invites
    set status = 'pending', invited_by = auth.uid(), accepted_at = null, created_at = now()
    where id = existing.id;
  else
    insert into public.household_invites (household_id, email, invited_by)
    values (hid, normalized, auth.uid());
  end if;

  return jsonb_build_object('ok', true, 'already_invited', false);
end;
$$;

create or replace function public.accept_household_invite()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := public.normalize_invite_email(coalesce(auth.jwt() ->> 'email', ''));
  invite public.household_invites%rowtype;
begin
  if auth.uid() is null or normalized = '' then
    return jsonb_build_object('ok', false, 'error', 'Sign in required.');
  end if;

  select * into invite
  from public.household_invites
  where email = normalized and status = 'pending'
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'No pending invite for this email.');
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (invite.household_id, auth.uid(), 'member')
  on conflict (household_id, user_id) do nothing;

  update public.household_invites
  set status = 'accepted', accepted_at = now()
  where id = invite.id;

  return jsonb_build_object('ok', true, 'household_id', invite.household_id);
end;
$$;

create or replace function public.revoke_household_invite(invite_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.household_invites%rowtype;
begin
  select * into invite from public.household_invites where id = invite_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invite not found.');
  end if;

  if not public.is_household_member(invite.household_id) then
    return jsonb_build_object('ok', false, 'error', 'Not allowed.');
  end if;

  update public.household_invites set status = 'revoked' where id = invite_id;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.remove_household_member(target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  my_role public.member_role;
begin
  select household_id, role into hid, my_role
  from public.household_members
  where user_id = auth.uid()
  limit 1;

  if hid is null or my_role <> 'owner' then
    return jsonb_build_object('ok', false, 'error', 'Only the owner can remove members.');
  end if;

  if target_user_id = auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'You can’t remove yourself.');
  end if;

  delete from public.household_members
  where household_id = hid and user_id = target_user_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.invite_household_member(text) to authenticated;
grant execute on function public.accept_household_invite() to authenticated;
grant execute on function public.revoke_household_invite(uuid) to authenticated;
grant execute on function public.remove_household_member(uuid) to authenticated;
