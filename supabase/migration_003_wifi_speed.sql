-- Let reviewers report their measured WiFi speed
alter table public.reviews
  add column if not exists wifi_speed_mbps integer;
