-- ============================================================
-- Insert policies for profile creation on signup
-- Without these, the client-side "create my own profile row after
-- auth.signUp" flow would be silently blocked by RLS (default deny).
-- admin_users intentionally has no insert policy: admin status is
-- granted manually (service role / SQL), never self-service.
-- ============================================================

create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

create policy "shelters_insert_own" on public.shelters
  for insert with check (auth.uid() = id);
