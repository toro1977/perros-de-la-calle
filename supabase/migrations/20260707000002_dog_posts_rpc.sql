-- ============================================================
-- RPCs for dog_posts: PostgREST can't cast plain lat/lng into a
-- `geography` column on insert, and can't extract lat/lng back out
-- of one on select — same pattern as Doggers' walker_zones RPCs.
-- ============================================================

create or replace function public.create_dog_post(
  p_type        text,
  p_photo_url   text,
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
    user_id, type, photo_url, breed, description, location, zone_text, event_date
  ) values (
    auth.uid(), p_type, p_photo_url, p_breed, p_description,
    st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
    p_zone_text, p_event_date
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_dog_post(
  text, text, double precision, double precision, text, date, text, text
) to authenticated;

-- Lists active posts with lat/lng extracted, optionally sorted by distance
-- from a reference point (p_lat/p_lng) and filtered by type.
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
  select
    p.id, p.user_id, p.type, p.photo_url, p.breed, p.description,
    st_y(p.location::geometry), st_x(p.location::geometry),
    p.zone_text, p.event_date, p.status, p.created_at,
    case
      when p_lat is not null and p_lng is not null
        then round((st_distance(p.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) / 1000)::numeric, 1)
      else null
    end as distance_km
  from public.dog_posts p
  where p.status = 'active'
    and (p_type is null or p.type = p_type)
  order by
    case when p_lat is not null and p_lng is not null
      then st_distance(p.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography)
    end asc nulls last,
    p.created_at desc;
$$;

grant execute on function public.list_dog_posts(double precision, double precision, text) to authenticated, anon;

-- Single post detail with lat/lng extracted
create or replace function public.get_dog_post(p_id uuid)
returns table (
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
  created_at  timestamptz
)
language sql
stable
security invoker
as $$
  select
    p.id, p.user_id, p.type, p.photo_url, p.breed, p.description,
    st_y(p.location::geometry), st_x(p.location::geometry),
    p.zone_text, p.event_date, p.status, p.created_at
  from public.dog_posts p
  where p.id = p_id;
$$;

grant execute on function public.get_dog_post(uuid) to authenticated, anon;
