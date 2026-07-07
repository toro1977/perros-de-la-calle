-- ============================================================
-- Donations to shelters via MercadoPago
-- Commission is fixed at 5% (see discovery decision), computed
-- and stored at donation time, not at settlement time.
-- Settlement mechanics are manual in v1 (same precedent as
-- Doggers' ADR-009).
-- ============================================================

create table public.donations (
  id             uuid primary key default gen_random_uuid(),
  shelter_id     uuid not null references public.shelters(id),
  donor_id       uuid references public.users(id), -- null if anonymous
  amount_ars     numeric(10,2) not null,
  commission_ars numeric(10,2) not null, -- 5% platform fee
  net_amount_ars numeric(10,2) not null, -- amount - commission
  mp_payment_id  text,
  status         text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'settled')),
  settled_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================

alter table public.donations enable row level security;

-- readable by the donor and by the receiving shelter
create policy "donations_select_participant" on public.donations
  for select using (
    auth.uid() = donor_id or auth.uid() = shelter_id
  );
