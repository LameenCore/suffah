-- Suffa — initial schema (hackathon scope)
-- Source of truth: docs/DATA_MODEL.md. Every table carries masjid_id for
-- multi-tenancy even though the demo has a single masjid.
--
-- Run: paste into the Supabase SQL editor, or `supabase db push` with the CLI.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tenancy + identity
-- ---------------------------------------------------------------------------

create table masjids (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create type user_role as enum ('admin', 'parent', 'student');

create table users (
  id         uuid primary key default gen_random_uuid(),
  masjid_id  uuid not null references masjids(id) on delete cascade,
  role       user_role not null,
  name       text not null,
  email      text not null,
  created_at timestamptz not null default now(),
  unique (masjid_id, email)
);

create type volunteer_status as enum ('active', 'inactive', 'pending_vetting');

create table volunteers (
  id                 uuid primary key default gen_random_uuid(),
  masjid_id          uuid not null references masjids(id) on delete cascade,
  user_id            uuid references users(id) on delete set null,
  name               text not null,
  status             volunteer_status not null default 'pending_vetting',
  certification_note text,
  joined_at          timestamptz not null default now(),
  left_at            timestamptz
);

-- ---------------------------------------------------------------------------
-- Pods
-- ---------------------------------------------------------------------------

create table pods (
  id           uuid primary key default gen_random_uuid(),
  masjid_id    uuid not null references masjids(id) on delete cascade,
  name         text not null,
  volunteer_id uuid references volunteers(id) on delete set null,
  max_students int not null default 4 check (max_students > 0 and max_students <= 4),
  created_at   timestamptz not null default now()
);

create table pod_students (
  id              uuid primary key default gen_random_uuid(),
  pod_id          uuid not null references pods(id) on delete cascade,
  student_user_id uuid not null references users(id) on delete cascade,
  unique (pod_id, student_user_id)
);

-- Hard cap: fewer than 5 students per pod (Quebec exemption threshold).
create or replace function enforce_pod_capacity() returns trigger as $$
declare
  current_count int;
  cap int;
begin
  select count(*) into current_count from pod_students where pod_id = new.pod_id;
  select max_students into cap from pods where id = new.pod_id;
  if current_count >= cap then
    raise exception 'pod % is at capacity (%).', new.pod_id, cap;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger pod_capacity_check
  before insert on pod_students
  for each row execute function enforce_pod_capacity();

-- ---------------------------------------------------------------------------
-- Curriculum
-- ---------------------------------------------------------------------------

create table courses (
  id         uuid primary key default gen_random_uuid(),
  masjid_id  uuid not null references masjids(id) on delete cascade,
  name       text not null,             -- 'Math' | 'Seerah' | 'AI Literacy'
  grade_band text not null              -- e.g. 'Secondary 1'
);

create table units (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references courses(id) on delete cascade,
  title          text not null,
  sequence_order int not null,
  unique (course_id, sequence_order)
);

create table pathway_nodes (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references courses(id) on delete cascade,
  unit_id        uuid references units(id) on delete set null,
  sequence_order int not null,
  title          text not null,
  lesson_content jsonb,                 -- generated once, then persisted (not regenerated per view)
  unique (course_id, sequence_order)
);

-- Continuity record: what node a pod is on, per course.
create table pod_progress (
  id              uuid primary key default gen_random_uuid(),
  pod_id          uuid not null references pods(id) on delete cascade,
  course_id       uuid not null references courses(id) on delete cascade,
  current_node_id uuid references pathway_nodes(id) on delete set null,
  unique (pod_id, course_id)
);

-- ---------------------------------------------------------------------------
-- Results (always tied to the individual student)
-- ---------------------------------------------------------------------------

create table checkpoint_results (
  id              uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references users(id) on delete cascade,
  pathway_node_id uuid not null references pathway_nodes(id) on delete cascade,
  passed          boolean not null,
  answer_data     jsonb,
  attempted_at    timestamptz not null default now()
);

create table unit_assessment_results (
  id              uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references users(id) on delete cascade,
  unit_id         uuid not null references units(id) on delete cascade,
  score           numeric(5,2) not null,
  passed          boolean not null,     -- threshold TBD; default 0.70 (see DATA_MODEL.md)
  answer_data     jsonb,
  attempted_at    timestamptz not null default now()
);

create table term_exam_results (
  id              uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references users(id) on delete cascade,
  course_id       uuid not null references courses(id) on delete cascade,
  term_label      text not null,
  score           numeric(5,2) not null,
  answer_data     jsonb,
  attempted_at    timestamptz not null default now()
);

create table compliance_reports (
  id              uuid primary key default gen_random_uuid(),
  student_user_id uuid not null references users(id) on delete cascade,
  term_label      text not null,
  generated_at    timestamptz not null default now(),
  report_data     jsonb not null,       -- aggregates checkpoint/unit/exam data at generation time
  exported        boolean not null default false
);

-- ---------------------------------------------------------------------------
-- Funding (mock data for the demo)
-- ---------------------------------------------------------------------------

create type ledger_entry_type as enum (
  'principal_deposit', 'return_disbursed', 'sadaqah_received', 'scholarship_allocated'
);

create table waqf_ledger (
  id         uuid primary key default gen_random_uuid(),
  masjid_id  uuid not null references masjids(id) on delete cascade,
  entry_type ledger_entry_type not null,
  amount     numeric(12,2) not null,
  note       text,
  created_at timestamptz not null default now()
);

create type fee_status as enum ('fee_paid', 'scholarship_covered');

create table family_fee_status (
  id              uuid primary key default gen_random_uuid(),
  masjid_id       uuid not null references masjids(id) on delete cascade,
  student_user_id uuid not null references users(id) on delete cascade,
  status          fee_status not null,
  updated_at      timestamptz not null default now(),
  unique (masjid_id, student_user_id)
);

-- ---------------------------------------------------------------------------
-- Indexes for the common access paths
-- ---------------------------------------------------------------------------

create index on users (masjid_id, role);
create index on pods (masjid_id);
create index on pod_students (student_user_id);
create index on courses (masjid_id);
create index on pathway_nodes (course_id, sequence_order);
create index on pod_progress (pod_id);
create index on checkpoint_results (student_user_id);
create index on unit_assessment_results (student_user_id);
create index on term_exam_results (student_user_id);
create index on compliance_reports (student_user_id);
create index on waqf_ledger (masjid_id, entry_type);
