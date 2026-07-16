-- ============================================================
-- "Vi a este perro" contact flow: the post detail screen needs the
-- author's phone to build a WhatsApp link. public.users.phone is only
-- readable by its owner (users_select_own RLS), so this function runs
-- as security definer to read it for the single post being viewed —
-- same "phone number on a lost-dog flyer" intent as the feature itself.
-- ============================================================

drop function if exists public.get_dog_post(uuid);

create or replace function public.get_dog_post(p_id uuid)
returns table (
  id            uuid,
  user_id       uuid,
  type          text,
  photo_url     text,
  breed         text,
  description   text,
  lat           double precision,
  lng           double precision,
  zone_text     text,
  event_date    date,
  status        text,
  created_at    timestamptz,
  contact_phone text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    p.id, p.user_id, p.type, p.photo_url, p.breed, p.description,
    st_y(p.location::geometry), st_x(p.location::geometry),
    p.zone_text, p.event_date, p.status, p.created_at,
    u.phone
  from public.dog_posts p
  join public.users u on u.id = p.user_id
  where p.id = p_id;
$$;

grant execute on function public.get_dog_post(uuid) to authenticated, anon;
