-- ============================================================
-- User profiles
-- auth.users is managed by Supabase Auth.
-- public.users mirrors it with app-level profile data.
-- admin_users and shelters extend users with role-specific data.
-- Individuals (dog owners, finders, adopters) use plain users rows —
-- no extra table, since they have no role-specific fields.
-- ============================================================

create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  phone       text,
  full_name   text not null,
  avatar_url  text,
  role        text not null check (role in ('individual', 'shelter', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.admin_users (
  id         uuid primary key references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.shelters (
  id                     uuid primary key references public.users(id) on delete cascade,
  shelter_name           text not null,
  cuit                   text,
  social_links           text,
  -- manual verification queue (no Truora in v1, see ADR-003)
  verification_status    text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected')),
  verification_documents text[], -- storage paths to backing documents
  reviewed_by            uuid references public.admin_users(id),
  reviewed_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================

alter table public.users enable row level security;
alter table public.admin_users enable row level security;
alter table public.shelters enable row level security;

-- users: each user can read/update their own row
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- admin_users: only readable by admins themselves (service role bypasses RLS)
create policy "admin_users_select_own" on public.admin_users
  for select using (auth.uid() = id);

-- shelters are publicly readable (needed for donation/adoption browsing)
create policy "shelters_select_public" on public.shelters
  for select using (true);

create policy "shelters_update_own" on public.shelters
  for update using (auth.uid() = id);
