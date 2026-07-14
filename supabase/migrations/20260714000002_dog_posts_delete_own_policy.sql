create policy "dog_posts_delete_own" on public.dog_posts
  for delete
  using (auth.uid() = user_id);
