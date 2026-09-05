-- Consent records for Law 25 (T36) + the parental-consent gate (T37).
--
-- Quebec's Law 25 requires consent that is "manifest, free, and enlightened" and
-- "given for specific purposes". For a minors' education product that means: a
-- guardian consents, per child, to a named set of purposes, and we can show what
-- they agreed to and when. Consent is versioned so a material change to what we
-- do re-prompts rather than silently riding on an old agreement.
--
-- One row per (child, consent version, decision). A withdrawal is a new row with
-- granted = false, not an update — the history stays intact (mirrors audit_log's
-- append-only intent, enforced here by an update/delete guard).
--
-- Run: npm run migrate  (or paste into the Supabase SQL editor).

create table if not exists consent_records (
  id                uuid primary key default gen_random_uuid(),
  masjid_id         uuid not null references masjids(id) on delete cascade,
  student_user_id   uuid not null references users(id) on delete cascade,
  guardian_user_id  uuid not null references users(id) on delete set null,
  consent_version   text not null,              -- e.g. '2026-09' — matches CONSENT_VERSION in code
  purposes          text[] not null,            -- the specific purposes agreed to (or declined)
  granted           boolean not null,           -- true = consented, false = withdrawn/declined
  document_hash     text,                       -- hash of the consent copy shown, for provenance
  recorded_at       timestamptz not null default now()
);

create index if not exists consent_records_student_idx
  on consent_records (masjid_id, student_user_id, recorded_at desc);

-- Append-only: a guardian's decisions are a legal record; the app (or a leaked
-- service-role key) must not be able to rewrite them without a schema change.
create or replace function consent_records_is_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'consent_records is append-only (%.%)', tg_op, tg_table_name;
end;
$$;

drop trigger if exists consent_records_no_mutate on consent_records;
create trigger consent_records_no_mutate
  before update or delete on consent_records
  for each row execute function consent_records_is_append_only();
