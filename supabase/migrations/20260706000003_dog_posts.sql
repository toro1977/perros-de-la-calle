-- ============================================================
-- Dog posts: lost, found and stray sightings
-- Single polymorphic table (see ADR-004) instead of 3 separate
-- tables, since lost/found/stray share almost every field.
-- ============================================================

create table public.dog_posts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  type         text not null check (type in ('lost', 'found', 'stray')),
  photo_url    text not null,
  breed        text,
  description  text,
  location     geography(point, 4326) not null,
  zone_text    text not null, -- human-readable area, shown without reverse geocoding
  event_date   date not null, -- when the dog was lost / found / last seen
  status       text not null default 'active' check (status in ('active', 'resolved', 'closed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================

alter table public.dog_posts enable row level security;

-- posts are publicly readable — the whole point of the app is visibility
create policy "dog_posts_select_public" on public.dog_posts
  for select using (true);

create policy "dog_posts_insert_own" on public.dog_posts
  for insert with check (auth.uid() = user_id);

create policy "dog_posts_update_own" on public.dog_posts
  for update using (auth.uid() = user_id);
