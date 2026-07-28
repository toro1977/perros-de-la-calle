-- ============================================================
-- Shelter verification becomes something requested from the profile
-- (not chosen at signup) and carries donation "display only" data —
-- see docs brief "Verificación de refugios/rescatistas + donaciones".
-- Columns are nullable: existing shelters rows (created during old
-- role-at-signup flow) keep working, filled in later via the new
-- shelter profile editor.
-- ============================================================

alter table public.shelters
  add column locality text,
  add column bio text,
  add column contact_whatsapp text,
  add column donation_alias text,
  add column donation_cbu text,
  add column donation_mp_link text;

-- ============================================================
-- shelters_public: append the new public-safe columns. Postgres allows
-- appending columns to a view via CREATE OR REPLACE as long as the
-- existing output columns keep their name/position/type — cuit,
-- verification_documents, reviewed_by/at stay excluded (private).
-- ============================================================

create or replace view public.shelters_public as
  select
    id,
    shelter_name,
    social_links,
    verification_status,
    created_at,
    locality,
    bio,
    contact_whatsapp,
    donation_alias,
    donation_cbu,
    donation_mp_link
  from public.shelters;

grant select on public.shelters_public to authenticated, anon;

-- ============================================================
-- Reinstate the verification gate for publishing adoption dogs, now
-- that verification is requestable (Section 3 of the brief) instead of
-- unreachable dead infrastructure.
-- ============================================================

drop policy if exists "adoption_dogs_insert_shelter" on public.adoption_dogs;

create policy "adoption_dogs_insert_verified_shelter" on public.adoption_dogs
  for insert to authenticated
  with check (
    auth.uid() = shelter_id
    and exists (
      select 1 from public.shelters s
      where s.id = auth.uid()
        and s.verification_status = 'approved'
    )
  );
