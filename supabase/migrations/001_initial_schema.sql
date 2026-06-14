-- Garage Log: households, vehicles, service visits, line items, attachments

create type public.member_role as enum ('owner', 'member');
create type public.parse_status as enum ('pending', 'needs_review', 'confirmed');
create type public.line_item_type as enum ('part', 'labor', 'fee', 'tax', 'other');
create type public.service_category as enum (
  'oil_fluid',
  'brakes',
  'tires',
  'battery',
  'filters',
  'suspension',
  'engine',
  'transmission',
  'electrical',
  'inspection',
  'other'
);

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Garage',
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  nickname text not null,
  year smallint,
  make text,
  model text,
  vin text,
  created_at timestamptz not null default now()
);

create table public.service_visits (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  service_date date not null,
  odometer integer,
  shop_name text,
  invoice_number text,
  total_cents integer,
  currency text not null default 'USD',
  advisor_notes text,
  parse_status public.parse_status not null default 'confirmed',
  raw_parse_json jsonb,
  confirmed_at timestamptz,
  confirmed_by_user_id uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.line_items (
  id uuid primary key default gen_random_uuid(),
  service_visit_id uuid not null references public.service_visits (id) on delete cascade,
  description text not null,
  category public.service_category not null default 'other',
  item_type public.line_item_type not null default 'other',
  quantity numeric(10, 2) not null default 1,
  unit_price_cents integer,
  line_total_cents integer,
  sort_order integer not null default 0
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  service_visit_id uuid not null references public.service_visits (id) on delete cascade,
  storage_path text not null,
  mime_type text,
  uploaded_at timestamptz not null default now()
);

create index idx_household_members_user on public.household_members (user_id);
create index idx_vehicles_household on public.vehicles (household_id);
create index idx_service_visits_vehicle_date on public.service_visits (vehicle_id, service_date desc);
create index idx_line_items_visit on public.line_items (service_visit_id);

-- Updated_at trigger for service_visits
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger service_visits_updated_at
  before update on public.service_visits
  for each row execute function public.set_updated_at();

-- RLS helpers
create or replace function public.is_household_member(h_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = h_id
      and hm.user_id = auth.uid()
  );
$$;

create or replace function public.vehicle_household_id(v_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.vehicles where id = v_id;
$$;

create or replace function public.visit_vehicle_id(sv_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select vehicle_id from public.service_visits where id = sv_id;
$$;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.vehicles enable row level security;
alter table public.service_visits enable row level security;
alter table public.line_items enable row level security;
alter table public.attachments enable row level security;

-- Households
create policy households_select on public.households
  for select using (public.is_household_member(id));

create policy households_insert on public.households
  for insert with check (true);

create policy households_update on public.households
  for update using (public.is_household_member(id));

-- Members
create policy members_select on public.household_members
  for select using (public.is_household_member(household_id));

create policy members_insert on public.household_members
  for insert with check (
    user_id = auth.uid()
    or public.is_household_member(household_id)
  );

-- Vehicles
create policy vehicles_all on public.vehicles
  for all using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

-- Service visits (via vehicle household)
create policy visits_select on public.service_visits
  for select using (
    public.is_household_member(public.vehicle_household_id(vehicle_id))
  );

create policy visits_insert on public.service_visits
  for insert with check (
    public.is_household_member(public.vehicle_household_id(vehicle_id))
  );

create policy visits_update on public.service_visits
  for update using (
    public.is_household_member(public.vehicle_household_id(vehicle_id))
  );

create policy visits_delete on public.service_visits
  for delete using (
    public.is_household_member(public.vehicle_household_id(vehicle_id))
  );

-- Line items
create policy line_items_all on public.line_items
  for all using (
    public.is_household_member(
      public.vehicle_household_id(public.visit_vehicle_id(service_visit_id))
    )
  )
  with check (
    public.is_household_member(
      public.vehicle_household_id(public.visit_vehicle_id(service_visit_id))
    )
  );

-- Attachments
create policy attachments_all on public.attachments
  for all using (
    public.is_household_member(
      public.vehicle_household_id(public.visit_vehicle_id(service_visit_id))
    )
  )
  with check (
    public.is_household_member(
      public.vehicle_household_id(public.visit_vehicle_id(service_visit_id))
    )
  );

-- Bootstrap household for new users
create or replace function public.bootstrap_household()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  h_id uuid;
  existing uuid;
begin
  select household_id into existing
  from public.household_members
  where user_id = auth.uid()
  limit 1;

  if existing is not null then
    return existing;
  end if;

  insert into public.households (name) values ('My Garage')
  returning id into h_id;

  insert into public.household_members (household_id, user_id, role)
  values (h_id, auth.uid(), 'owner');

  return h_id;
end;
$$;

grant execute on function public.bootstrap_household() to authenticated;

-- Storage bucket for invoice files
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

create policy invoices_select on storage.objects
  for select using (
    bucket_id = 'invoices'
    and auth.role() = 'authenticated'
    and public.is_household_member((storage.foldername(name))[1]::uuid)
  );

create policy invoices_insert on storage.objects
  for insert with check (
    bucket_id = 'invoices'
    and auth.role() = 'authenticated'
    and public.is_household_member((storage.foldername(name))[1]::uuid)
  );

create policy invoices_delete on storage.objects
  for delete using (
    bucket_id = 'invoices'
    and auth.role() = 'authenticated'
    and public.is_household_member((storage.foldername(name))[1]::uuid)
  );
