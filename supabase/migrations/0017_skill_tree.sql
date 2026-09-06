-- Prerequisite / skill-tree mapping (T43).
--
-- Nodes are a flat per-course sequence. This adds an explicit prerequisite graph
-- (edges can cross courses) and a concept tag per node, so the playground can
-- lock a node with a reason and the admin can see/edit the dependencies.

alter table pathway_nodes add column if not exists concept_tag text;

create table if not exists node_prerequisites (
  id              uuid primary key default gen_random_uuid(),
  node_id         uuid not null references pathway_nodes(id) on delete cascade,
  prereq_node_id  uuid not null references pathway_nodes(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (node_id, prereq_node_id),
  check (node_id <> prereq_node_id)
);

create index if not exists node_prerequisites_node_idx on node_prerequisites (node_id);
