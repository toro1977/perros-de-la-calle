-- ============================================================
-- One-time data fix: public.users.phone was stored as free-form text
-- (whatever the user typed at registration). wa.me links need clean
-- E.164 (+549XXXXXXXXXX) — see src/utils/phone.ts for the client-side
-- version of this exact logic, now enforced at registration time.
--
-- This function is temporary: it only exists to normalize the phones
-- already in the table, then gets dropped at the end of this migration.
-- ============================================================

create or replace function pg_temp.normalize_ar_phone(raw text)
returns text
language plpgsql
immutable
as $$
declare
  digits text := regexp_replace(coalesce(raw, ''), '\D', '', 'g');
  area_len int;
begin
  if digits = '' then
    return null;
  end if;

  -- Strip a country code the user already included, with or without "9".
  if left(digits, 2) = '54' and length(digits) >= 12 then
    digits := substring(digits from 3);
  end if;

  -- Strip a mobile marker "9" the user already included.
  if left(digits, 1) = '9' and length(digits) = 11 then
    digits := substring(digits from 2);
  end if;

  -- Strip the trunk prefix "0" used for local dialing.
  if left(digits, 1) = '0' then
    digits := substring(digits from 2);
  end if;

  -- Strip an inserted "15" (old local-mobile dialing pattern).
  if length(digits) = 12 then
    foreach area_len in array array[2, 3, 4] loop
      if substring(digits from area_len + 1 for 2) = '15' then
        digits := substring(digits from 1 for area_len) || substring(digits from area_len + 3);
        exit;
      end if;
    end loop;
  end if;

  if length(digits) <> 10 then
    return null;
  end if;

  return '+549' || digits;
end;
$$;

update public.users
set phone = pg_temp.normalize_ar_phone(phone)
where phone is not null;

drop function pg_temp.normalize_ar_phone(text);
