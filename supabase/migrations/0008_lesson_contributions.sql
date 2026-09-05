-- Suffa — community knowledge sourcing for lessons (T22, differentiator).
--
-- Seerah has no external curriculum vendor, so the masjid's own scholars/elders
-- react to an AI-generated draft; their text notes are folded into the next
-- version of the lesson. A genuine AI + community hybrid.
--
-- The revision metadata (version, who was incorporated) lives inside
-- pathway_nodes.lesson_content JSON — no column change needed here.
--
-- Run: npm run migrate  (or paste into the Supabase SQL editor).

create table if not exists lesson_contributions (
  id               uuid primary key default gen_random_uuid(),
  node_id          uuid not null references pathway_nodes(id) on delete cascade,
  contributor_name text not null,
  contributor_role text,                 -- e.g. "imam", "elder", "hafiz"
  note             text not null,
  incorporated     boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists lesson_contributions_node_idx
  on lesson_contributions (node_id);
