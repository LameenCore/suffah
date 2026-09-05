-- Audit trail for sensitive admin actions (T35).
--
-- Append-only: a BEFORE UPDATE OR DELETE trigger rejects any mutation, so the
-- trail cannot be rewritten from the app (or a leaked service-role key) without
-- a schema change. No PII beyond ids + action names + small metadata.

create table if not exists audit_log (
  id            uuid primary key default gen_random_uuid(),
  masjid_id     uuid not null references masjids(id) on delete cascade,
  actor_user_id uuid references users(id) on delete set null,
  actor_role    text,
  action        text not null,          -- e.g. 'volunteer.departure', 'pod.student_added'
  target_type   text,                   -- e.g. 'volunteer', 'pod', 'compliance_report'
  target_id     text,                   -- id (or composite label) of the thing acted on
  metadata      jsonb not null default '{}'::jsonb,
  at            timestamptz not null default now()
);

create index if not exists audit_log_masjid_at_idx on audit_log (masjid_id, at desc);

create or replace function audit_log_is_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log is append-only (%.%)', tg_op, tg_table_name;
end;
$$;

drop trigger if exists audit_log_no_mutate on audit_log;
create trigger audit_log_no_mutate
  before update or delete on audit_log
  for each row execute function audit_log_is_append_only();
