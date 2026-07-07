-- ============================================================
-- Community reports on dog_posts or adoption_dogs (moderation)
-- Publication is always immediate (see ADR discovery decision);
-- reports are the only moderation mechanism in v1, reviewed
-- manually — no panel, no fixed SLA yet (see ADR-007).
-- ============================================================

create table public.reports (
  id              uuid primary key default gen_random_uuid(),
  dog_post_id     uuid references public.dog_posts(id) on delete cascade,
  adoption_dog_id uuid references public.adoption_dogs(id) on delete cascade,
  reported_by     uuid not null references public.users(id),
  reason          text not null,
  status          text not null default 'pending' check (status in ('pending', 'reviewed')),
  resolved_by     uuid references public.admin_users(id),
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  constraint reports_exactly_one_target check (
    (dog_post_id is not null and adoption_dog_id is null)
    or (dog_post_id is null and adoption_dog_id is not null)
  )
);

-- ============================================================
-- RLS
-- ============================================================

alter table public.reports enable row level security;

-- reporters can see their own reports; admins can see all
create policy "reports_select_own_or_admin" on public.reports
  for select using (
    auth.uid() = reported_by
    or exists (select 1 from public.admin_users where id = auth.uid())
  );

create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reported_by);
