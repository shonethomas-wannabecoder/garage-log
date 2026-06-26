-- Per-vehicle notes to discuss with the shop on the next visit.

alter table public.vehicles
  add column if not exists shop_concerns text;
