-- ============================================================
-- Multiple photos per dog post (up to 4, enforced client-side).
-- dog_posts table has no rows yet (pre-launch), so this is a clean
-- column swap instead of a data migration.
-- ============================================================

alter table public.dog_posts
  drop column photo_url,
  add column photo_urls text[] not null default '{}';

alter table public.dog_posts
  add constraint dog_posts_photo_urls_not_empty check (cardinality(photo_urls) >= 1);

-- Recreate the RPCs with photo_urls text[] instead of photo_url text.

drop function if exists public.create_dog_post(text, text, double precision, double precision, text, date, text, text);

create or replace function public.create_dog_post(
  p_type        text,
  p_photo_urls  text[],
  p_lat         double precision,
  p_lng         double precision,
  p_zone_text   text,
  p_event_date  date,
  p_breed       text default null,
  p_description text default null
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid;
begin
  insert into public.dog_posts (
    user_id, type, photo_urls, breed, description, location, zone_text, event_date
  ) values (
    auth.uid(), p_type, p_photo_urls, p_breed, p_description,
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
    p_zone_text, p_event_date
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_dog_post(
  text, text[], double precision, double precision, text, date, text, text
) to authenticated;

-- Keep the KNN-index-friendly shape from 20260708000002 — only the
-- photo_url -> photo_urls column swap changes here.
drop function if exists public.list_dog_posts(double precision, double precision, text);

create or replace function public.list_dog_posts(
  p_lat  double precision default null,
  p_lng  double precision default null,
  p_type text default null
) returns table (
  id          uuid,
  user_id     uuid,
  type        text,
  photo_urls  text[],
  breed       text,
  description text,
  lat         double precision,
  lng         double precision,
  zone_text   text,
  event_date  date,
  status      text,
  created_at  timestamptz,
  distance_km numeric
)
language sql
stable
security invoker
as $$
  with base as (
    select
      p.*,
      case
        when p_lat is not null and p_lng is not null
          then p.location <-> st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
        else null
      end as distance_m
    from public.dog_posts p
    where p.status = 'active'
      and (p_type is null or p.type = p_type)
  )
  select
    id, user_id, type, photo_urls, breed, description,
    st_y(location::geometry), st_x(location::geometry),
    zone_text, event_date, status, created_at,
    round((distance_m / 1000)::numeric, 1) as distance_km
  from base
  order by distance_m asc nulls last, created_at desc;
$$;

grant execute on function public.list_dog_posts(double precision, double precision, text) to authenticated, anon;

drop function if exists public.get_dog_post(uuid);

create or replace function public.get_dog_post(p_id uuid)
returns table (
  id            uuid,
  user_id       uuid,
  type          text,
  photo_urls    text[],
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
    p.id, p.user_id, p.type, p.photo_urls, p.breed, p.description,
    st_y(p.location::geometry), st_x(p.location::geometry),
    p.zone_text, p.event_date, p.status, p.created_at,
    u.phone
  from public.dog_posts p
  join public.users u on u.id = p.user_id
  where p.id = p_id;
$$;

grant execute on function public.get_dog_post(uuid) to authenticated, anon;
