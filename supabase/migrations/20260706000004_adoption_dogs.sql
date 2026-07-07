-- ============================================================
-- Dogs listed for adoption by verified shelters
-- Separate from dog_posts: different lifecycle (available/in_process/
-- adopted vs. active/resolved/closed) and always tied to a shelter.
-- ============================================================

create table public.adoption_dogs (
  id           uuid primary key default gen_random_uuid(),
  shelter_id   uuid not null references public.shelters(id) on delete cascade,
  name         text,
  breed        text,
  description  text,
  photo_url    text not null,
  status       text not null default 'available'
    check (status in ('available', 'in_process', 'adopted')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================

alter table public.adoption_dogs enable row level security;

-- publicly readable so adopters can browse
create policy "adoption_dogs_select_public" on public.adoption_dogs
  for select using (true);

-- only verified shelters can publish
create policy "adoption_dogs_insert_verified_shelter" on public.adoption_dogs
  for insert with check (
    auth.uid() = shelter_id
    and exists (
      select 1 from public.shelters
      where id = auth.uid() and verification_status = 'approved'
    )
  );

create policy "adoption_dogs_update_own" on public.adoption_dogs
  for update using (auth.uid() = shelter_id);
