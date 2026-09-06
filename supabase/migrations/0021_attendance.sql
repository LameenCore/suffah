-- Enrichment-session attendance (T48).
--
-- The volunteer runs in-person enrichment; who showed up is a real signal for
-- continuity briefings, the consistency indicator (T52) and a family's
-- engagement. One row per session, one attendance row per student per session.

create table if not exists enrichment_sessions (
  id           uuid primary key default gen_random_uuid(),
  masjid_id    uuid not null references masjids(id) on delete cascade,
  pod_id       uuid not null references pods(id) on delete cascade,
  session_date date not null,
  topic        text,
  recorded_by  uuid references users(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (pod_id, session_date)
);

create table if not exists attendance_records (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references enrichment_sessions(id) on delete cascade,
  student_user_id  uuid not null references users(id) on delete cascade,
  status           text not null check (status in ('present', 'absent', 'excused')),
  created_at       timestamptz not null default now(),
  unique (session_id, student_user_id)
);

create index if not exists enrichment_sessions_pod_idx
  on enrichment_sessions (pod_id, session_date desc);
create index if not exists attendance_records_student_idx
  on attendance_records (student_user_id);
