-- ============================================================
-- Fix: list_dog_posts computed st_distance() twice per row (once in
-- the SELECT, once again in ORDER BY), and neither call used the
-- `<->` KNN operator, so dog_posts_location_gix couldn't accelerate
-- the sort — every location-sorted list did a full scan.
--
-- Fix: compute the KNN distance once in a CTE (Postgres inlines this,
-- so the planner can still push the ORDER BY down to the index) and
-- reuse it for both the projected distance_km and the sort.
-- ============================================================

create or replace function public.list_dog_posts(
  p_lat  double precision default null,
  p_lng  double precision default null,
  p_type text default null
) returns table (
  id          uuid,
  user_id     uuid,
  type        text,
  photo_url   text,
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
    id, user_id, type, photo_url, breed, description,
    st_y(location::geometry), st_x(location::geometry),
    zone_text, event_date, status, created_at,
    round((distance_m / 1000)::numeric, 1) as distance_km
  from base
  order by distance_m asc nulls last, created_at desc;
$$;
