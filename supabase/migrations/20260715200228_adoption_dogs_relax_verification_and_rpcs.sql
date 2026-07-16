-- Fase actual: cualquier cuenta de refugio puede publicar, sin
-- esperar aprobación manual. shelters.verification_status queda en
-- la tabla para cuando se arme un flujo de admin real antes de
-- lanzar a producción — no se borra la infraestructura, solo se
-- deja de exigir en esta política.
drop policy if exists "adoption_dogs_insert_verified_shelter" on public.adoption_dogs;

create policy "adoption_dogs_insert_shelter" on public.adoption_dogs
  for insert
  with check (auth.uid() = shelter_id);

create policy "adoption_dogs_delete_own" on public.adoption_dogs
  for delete
  using (auth.uid() = shelter_id);

create or replace function public.list_adoption_dogs()
returns table (
  id uuid,
  shelter_id uuid,
  shelter_name text,
  name text,
  breed text,
  description text,
  photo_url text,
  status text,
  created_at timestamptz
)
language sql
security invoker
as $$
  select
    a.id, a.shelter_id, s.shelter_name, a.name, a.breed, a.description,
    a.photo_url, a.status, a.created_at
  from public.adoption_dogs a
  join public.shelters s on s.id = a.shelter_id
  where a.status = 'available'
  order by a.created_at desc;
$$;

grant execute on function public.list_adoption_dogs() to authenticated, anon;

create or replace function public.get_adoption_dog(p_id uuid)
returns table (
  id uuid,
  shelter_id uuid,
  shelter_name text,
  name text,
  breed text,
  description text,
  photo_url text,
  status text,
  created_at timestamptz,
  contact_phone text
)
language sql
security invoker
as $$
  select
    a.id, a.shelter_id, s.shelter_name, a.name, a.breed, a.description,
    a.photo_url, a.status, a.created_at, u.phone as contact_phone
  from public.adoption_dogs a
  join public.shelters s on s.id = a.shelter_id
  join public.users u on u.id = a.shelter_id
  where a.id = p_id;
$$;

grant execute on function public.get_adoption_dog(uuid) to authenticated, anon;

create or replace function public.create_adoption_dog(
  p_name text,
  p_photo_url text,
  p_breed text default null,
  p_description text default null
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_id uuid;
begin
  insert into public.adoption_dogs (shelter_id, name, breed, description, photo_url)
  values (auth.uid(), p_name, p_breed, p_description, p_photo_url)
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.create_adoption_dog(text, text, text, text) to authenticated;

create or replace function public.update_adoption_dog_status(p_id uuid, p_status text)
returns void
language plpgsql
security invoker
as $$
begin
  update public.adoption_dogs set status = p_status, updated_at = now()
  where id = p_id and shelter_id = auth.uid();
end;
$$;

grant execute on function public.update_adoption_dog_status(uuid, text) to authenticated;
