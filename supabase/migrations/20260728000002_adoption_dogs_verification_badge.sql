-- ============================================================
-- Extend the adoption RPCs with shelter verification + donation data
-- (badge + "cómo ayudar" block), and fix two bugs found while doing so:
--
-- 1. Both RPCs joined raw public.shelters, which since
--    20260708000001 (which dropped the public select policy in favor
--    of the shelters_public view) only has an owner-only RLS policy.
--    As security invoker, that inner join silently filtered out every
--    row except a dog's own shelter viewing its own listing — the
--    adoption feed and detail screen have been returning empty to any
--    other user since that migration. Switching the join target to
--    shelters_public (public-readable) fixes it for both.
--
-- 2. get_adoption_dog additionally joined public.users for
--    contact_phone — same invoker/RLS problem, compounding the same
--    bug. Since that join intentionally needs to read a normally-
--    private column (same "phone number on a lost-dog flyer" intent
--    as get_dog_post), it becomes security definer, mirroring
--    get_dog_post's existing pattern instead of relying on RLS to
--    happen to allow it.
-- ============================================================

drop function if exists public.list_adoption_dogs();

create or replace function public.list_adoption_dogs()
returns table (
  id                   uuid,
  shelter_id           uuid,
  shelter_name         text,
  name                 text,
  breed                text,
  description          text,
  photo_urls           text[],
  status               text,
  created_at           timestamptz,
  verification_status  text,
  locality             text,
  bio                  text,
  donation_alias       text,
  donation_cbu         text,
  donation_mp_link     text,
  contact_whatsapp     text
)
language sql
stable
security invoker
as $$
  select
    a.id, a.shelter_id, s.shelter_name, a.name, a.breed, a.description,
    a.photo_urls, a.status, a.created_at,
    s.verification_status, s.locality, s.bio,
    s.donation_alias, s.donation_cbu, s.donation_mp_link, s.contact_whatsapp
  from public.adoption_dogs a
  join public.shelters_public s on s.id = a.shelter_id
  where a.status = 'available'
  order by a.created_at desc;
$$;

grant execute on function public.list_adoption_dogs() to authenticated, anon;

drop function if exists public.get_adoption_dog(uuid);

create or replace function public.get_adoption_dog(p_id uuid)
returns table (
  id                   uuid,
  shelter_id           uuid,
  shelter_name         text,
  name                 text,
  breed                text,
  description          text,
  photo_urls           text[],
  status               text,
  created_at           timestamptz,
  contact_phone        text,
  verification_status  text,
  locality             text,
  bio                  text,
  donation_alias       text,
  donation_cbu         text,
  donation_mp_link     text,
  contact_whatsapp     text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    a.id, a.shelter_id, s.shelter_name, a.name, a.breed, a.description,
    a.photo_urls, a.status, a.created_at,
    u.phone as contact_phone,
    s.verification_status, s.locality, s.bio,
    s.donation_alias, s.donation_cbu, s.donation_mp_link, s.contact_whatsapp
  from public.adoption_dogs a
  join public.shelters_public s on s.id = a.shelter_id
  join public.users u on u.id = a.shelter_id
  where a.id = p_id;
$$;

grant execute on function public.get_adoption_dog(uuid) to authenticated, anon;
