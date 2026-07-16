-- ============================================================
-- Multiple photos per adoption dog (up to 4, enforced client-side),
-- matching the dog_posts pattern. adoption_dogs has no rows yet
-- (pre-launch), so this is a clean column swap instead of a data
-- migration.
-- ============================================================

alter table public.adoption_dogs
  drop column photo_url,
  add column photo_urls text[] not null default '{}';

alter table public.adoption_dogs
  add constraint adoption_dogs_photo_urls_not_empty check (cardinality(photo_urls) >= 1);

drop function if exists public.list_adoption_dogs();

create or replace function public.list_adoption_dogs()
returns table (
  id uuid,
  shelter_id uuid,
  shelter_name text,
  name text,
  breed text,
  description text,
  photo_urls text[],
  status text,
  created_at timestamptz
)
language sql
security invoker
as $$
  select
    a.id, a.shelter_id, s.shelter_name, a.name, a.breed, a.description,
    a.photo_urls, a.status, a.created_at
  from public.adoption_dogs a
  join public.shelters s on s.id = a.shelter_id
  where a.status = 'available'
  order by a.created_at desc;
$$;

grant execute on function public.list_adoption_dogs() to authenticated, anon;

drop function if exists public.get_adoption_dog(uuid);

create or replace function public.get_adoption_dog(p_id uuid)
returns table (
  id uuid,
  shelter_id uuid,
  shelter_name text,
  name text,
  breed text,
  description text,
  photo_urls text[],
  status text,
  created_at timestamptz,
  contact_phone text
)
language sql
security invoker
as $$
  select
    a.id, a.shelter_id, s.shelter_name, a.name, a.breed, a.description,
    a.photo_urls, a.status, a.created_at, u.phone as contact_phone
  from public.adoption_dogs a
  join public.shelters s on s.id = a.shelter_id
  join public.users u on u.id = a.shelter_id
  where a.id = p_id;
$$;

grant execute on function public.get_adoption_dog(uuid) to authenticated, anon;

drop function if exists public.create_adoption_dog(text, text, text, text);

create or replace function public.create_adoption_dog(
  p_name text,
  p_photo_urls text[],
  p_breed text default null,
  p_description text default null
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid;
begin
  insert into public.adoption_dogs (shelter_id, name, breed, description, photo_urls)
  values (auth.uid(), p_name, p_breed, p_description, p_photo_urls)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.create_adoption_dog(text, text[], text, text) to authenticated;
