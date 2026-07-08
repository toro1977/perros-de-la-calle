-- ============================================================
-- Fix: shelters_select_public exposed every column (cuit,
-- verification_documents, reviewed_by/at) to anyone. Public browsing
-- (donations/adoption, E06-E08) only needs name/status/social links —
-- the rest is sensitive and only the shelter itself (or an admin via
-- service role) should see it.
-- ============================================================

drop policy if exists "shelters_select_public" on public.shelters;

create policy "shelters_select_own_full" on public.shelters
  for select using (auth.uid() = id);

-- Owned by the migration role, so it bypasses the table's RLS and
-- exposes exactly the columns listed here to everyone — regardless of
-- verification_status, so the client can still show e.g. a "pending"
-- badge for unverified shelters if needed.
create view public.shelters_public as
  select id, shelter_name, social_links, verification_status, created_at
  from public.shelters;

grant select on public.shelters_public to authenticated, anon;
