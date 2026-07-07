-- ============================================================
-- Push notification log
-- ============================================================

create table public.push_notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  title        text not null,
  body         text not null,
  data         jsonb,
  status       text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  sent_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================

alter table public.push_notifications enable row level security;

-- users can only read their own notifications
create policy "push_notifications_select_own" on public.push_notifications
  for select using (auth.uid() = user_id);
