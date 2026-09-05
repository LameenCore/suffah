-- AI lesson-tutor transcript (T45).
--
-- One row per message (student question or tutor answer), scoped to a node so a
-- volunteer/parent can review what was asked about a given lesson. Messages
-- cannot be EDITED (a saved transcript must not be silently rewritten), but they
-- CAN be deleted - for demo resets and Law 25 erasure requests.

create table if not exists tutor_messages (
  id                uuid primary key default gen_random_uuid(),
  student_user_id   uuid not null references users(id) on delete cascade,
  pathway_node_id   uuid not null references pathway_nodes(id) on delete cascade,
  role              text not null check (role in ('student', 'tutor')),
  content           text not null,
  flagged           boolean not null default false,  -- tutor declined / off-topic / safety
  created_at        timestamptz not null default now()
);

create index if not exists tutor_messages_student_node_idx
  on tutor_messages (student_user_id, pathway_node_id, created_at);

create or replace function tutor_messages_no_edit()
returns trigger language plpgsql as $$
begin
  raise exception 'tutor_messages rows cannot be edited (only inserted or deleted)';
end;
$$;

drop trigger if exists tutor_messages_no_mutate on tutor_messages;
drop trigger if exists tutor_messages_no_edit on tutor_messages;
create trigger tutor_messages_no_edit
  before update on tutor_messages
  for each row execute function tutor_messages_no_edit();
