-- Fix: the append-only triggers on audit_log / consent_records / model_call_log
-- blocked *every* DELETE, including the cascade delete that fires when a whole
-- tenant (masjid) or a student is removed. That made a masjid with any audit row
-- impossible to delete — breaking provisionMasjid()'s rollback (T33) and the
-- right-to-erasure path (T36), and leaving test tenants un-removable.
--
-- The real security property is "the application cannot rewrite or selectively
-- delete history". Removing an entire parent row is not that. So: a DELETE is
-- allowed only when the row's parent is already gone (i.e. it's a genuine
-- cascade); a direct DELETE while the parent still exists is still rejected, and
-- UPDATE is still rejected outright.
--
-- Run: npm run migrate

create or replace function audit_log_is_append_only()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if not exists (select 1 from public.masjids where id = old.masjid_id) then
      return old;  -- tenant is being removed; let the cascade through
    end if;
    raise exception 'audit_log is append-only (direct DELETE blocked)';
  end if;
  raise exception 'audit_log is append-only (% blocked)', tg_op;
end;
$$;

create or replace function consent_records_is_append_only()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if not exists (select 1 from public.masjids where id = old.masjid_id)
       or not exists (select 1 from public.users where id = old.student_user_id) then
      return old;  -- masjid or student is being removed; let the cascade through
    end if;
    raise exception 'consent_records is append-only (direct DELETE blocked)';
  end if;
  raise exception 'consent_records is append-only (% blocked)', tg_op;
end;
$$;

create or replace function model_call_log_is_append_only()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    -- masjid_id is nullable with ON DELETE SET NULL, so a tenant removal orphans
    -- the row rather than cascading. Allow purging an already-orphaned row.
    if old.masjid_id is null
       or not exists (select 1 from public.masjids where id = old.masjid_id) then
      return old;
    end if;
    raise exception 'model_call_log is append-only (direct DELETE blocked)';
  end if;
  raise exception 'model_call_log is append-only (% blocked)', tg_op;
end;
$$;
