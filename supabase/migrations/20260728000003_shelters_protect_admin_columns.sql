-- ============================================================
-- shelters_insert_own/shelters_update_own (pre-existing) only check
-- auth.uid() = id, with no constraint on which values land in
-- verification_status/reviewed_by/reviewed_at/verification_documents/
-- cuit. That means any authenticated user could call
-- supabase.from('shelters').update({ verification_status: 'approved' })
-- directly against PostgREST and self-approve — completely defeating
-- this feature's "manual approval" premise (the badge, donation
-- display, and the adoption_dogs insert gate all key off that column).
--
-- A plain RLS `with check` can't express "this column may only be
-- unchanged or reset to 'pending'" (it has no way to reference the OLD
-- row), so this uses a trigger instead. It only intervenes for
-- auth.role() = 'authenticated' — requests made through PostgREST as a
-- normal app user. The dashboard's Table Editor / SQL Editor connect
-- directly (not through PostgREST), where auth.role() reads as NULL, so
-- the manual approval flow documented in docs/verificacion-refugios.md
-- is unaffected.
-- ============================================================

create or replace function public.shelters_protect_admin_columns()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' then
    if TG_OP = 'UPDATE' then
      if NEW.verification_status is distinct from OLD.verification_status and NEW.verification_status <> 'pending' then
        NEW.verification_status := OLD.verification_status;
      end if;
      NEW.reviewed_by := OLD.reviewed_by;
      NEW.reviewed_at := OLD.reviewed_at;
      NEW.verification_documents := OLD.verification_documents;
      NEW.cuit := OLD.cuit;
    elsif TG_OP = 'INSERT' then
      NEW.verification_status := 'pending';
      NEW.reviewed_by := null;
      NEW.reviewed_at := null;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists shelters_protect_admin_columns_trigger on public.shelters;

create trigger shelters_protect_admin_columns_trigger
  before insert or update on public.shelters
  for each row
  execute function public.shelters_protect_admin_columns();
