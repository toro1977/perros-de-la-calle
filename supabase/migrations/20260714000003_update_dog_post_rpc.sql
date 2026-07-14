create or replace function public.update_dog_post(
  p_id          uuid,
  p_type        text,
  p_photo_urls  text[],
  p_lat         double precision,
  p_lng         double precision,
  p_zone_text   text,
  p_breed       text default null,
  p_description text default null
) returns void
language plpgsql
security invoker
as $$
begin
  update public.dog_posts set
    type = p_type,
    photo_urls = p_photo_urls,
    breed = p_breed,
    description = p_description,
    location = st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
    zone_text = p_zone_text,
    updated_at = now()
  where id = p_id
    and user_id = auth.uid();
end;
$$;

grant execute on function public.update_dog_post(
  uuid, text, text[], double precision, double precision, text, text, text
) to authenticated;
