-- Add per-category average rating columns to cafes
alter table public.cafes
  add column if not exists avg_wifi_rating  numeric(3,2),
  add column if not exists avg_noise_rating numeric(3,2),
  add column if not exists avg_power_rating numeric(3,2);
