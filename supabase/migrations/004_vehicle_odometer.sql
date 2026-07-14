-- Standalone vehicle mileage independent of the latest invoice.

alter table public.vehicles
  add column if not exists current_odometer integer,
  add column if not exists odometer_updated_at timestamptz;
