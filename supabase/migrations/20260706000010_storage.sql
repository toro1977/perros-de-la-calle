-- ============================================================
-- Storage buckets: dog photos (public) and shelter verification
-- documents (private, reviewed manually per ADR-003).
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dog-photos',
  'dog-photos',
  true,           -- public so photo_url works without signed URLs
  5242880,        -- 5 MB limit
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shelter-documents',
  'shelter-documents',
  false,          -- private, reviewed manually by an admin
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
)
on conflict (id) do nothing;

-- dog-photos: anyone authenticated can upload, anyone can view, owner can delete their own
create policy "dog_photos_insert_authenticated" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dog-photos');

create policy "dog_photos_select_public" on storage.objects
  for select using (bucket_id = 'dog-photos');

create policy "dog_photos_delete_owner" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'dog-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- shelter-documents: shelter can upload/view their own; admins reviewed via
-- service role / Supabase dashboard directly (no policy needed for that path)
create policy "shelter_documents_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'shelter-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "shelter_documents_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'shelter-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
