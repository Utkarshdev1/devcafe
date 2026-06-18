-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles ──────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text unique not null,
  username    text unique,
  full_name   text,
  avatar_url  text,
  bio         text,
  created_at  timestamptz default now() not null
);

-- ─── Cafes ─────────────────────────────────────────────────────────────────
create table public.cafes (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text,
  address          text not null,
  neighborhood     text,
  lat              double precision not null,
  lng              double precision not null,
  amenities        text[]   default '{}',
  wifi_speed_mbps  integer,
  noise_level      text     check (noise_level in ('quiet', 'moderate', 'lively')),
  power_outlets    text     check (power_outlets in ('none', 'few', 'plenty')) default 'none',
  rating           decimal(3,2) default 0 not null,
  review_count     integer  default 0 not null,
  images           text[]   default '{}',
  opening_hours    jsonb,
  price_range      integer  check (price_range in (1, 2, 3)) default 2,
  phone            text,
  website          text,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

-- ─── Reviews ───────────────────────────────────────────────────────────────
create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  cafe_id      uuid references public.cafes(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  rating       integer check (rating between 1 and 5) not null,
  comment      text,
  wifi_rating  integer check (wifi_rating between 1 and 5),
  power_rating integer check (power_rating between 1 and 5),
  noise_rating integer check (noise_rating between 1 and 5),
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null,
  unique(cafe_id, user_id)
);

-- ─── Row Level Security ─────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.cafes    enable row level security;
alter table public.reviews  enable row level security;

create policy "Cafes are publicly viewable"    on public.cafes    for select using (true);
create policy "Reviews are publicly viewable"  on public.reviews  for select using (true);
create policy "Profiles are publicly viewable" on public.profiles for select using (true);

create policy "Authenticated users can insert reviews"
  on public.reviews for insert with check (auth.uid() = user_id);

create policy "Users can update their own reviews"
  on public.reviews for update using (auth.uid() = user_id);

create policy "Users can delete their own reviews"
  on public.reviews for delete using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- ─── Triggers ───────────────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger cafes_updated_at
  before update on public.cafes
  for each row execute function update_updated_at();

create trigger reviews_updated_at
  before update on public.reviews
  for each row execute function update_updated_at();

-- Auto-create profile when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Recompute cafe rating after every review change
create or replace function update_cafe_rating()
returns trigger language plpgsql as $$
declare target_id uuid;
begin
  target_id := coalesce(new.cafe_id, old.cafe_id);
  update public.cafes set
    rating       = coalesce((select avg(rating)::decimal(3,2) from public.reviews where cafe_id = target_id), 0),
    review_count = (select count(*) from public.reviews where cafe_id = target_id)
  where id = target_id;
  return coalesce(new, old);
end;
$$;

create trigger after_review_change
  after insert or update or delete on public.reviews
  for each row execute function update_cafe_rating();
