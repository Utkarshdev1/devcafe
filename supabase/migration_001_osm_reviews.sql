-- Allow OSM cafés to be upserted into Supabase during review submission
alter table public.cafes add column if not exists osm_id text unique;

-- Allow any authenticated user to insert cafes (needed when a reviewer upserts an OSM café)
create policy "Authenticated users can insert cafes"
  on public.cafes for insert
  with check (auth.uid() is not null);

-- Allow any authenticated user to update cafe metadata
-- (rating/review_count are updated by the trigger; this covers the upsert path)
create policy "Authenticated users can update cafes"
  on public.cafes for update
  using (auth.uid() is not null);
