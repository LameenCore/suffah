-- Structured log of every Anthropic model call (T34).
--
-- One row per call: which feature, how many tokens, estimated cost, and whether
-- it was a real model response or a hand-authored fallback. This is the raw feed
-- for AI-spend monitoring + budget alerts (T56) and for reconciling the
-- waqf-ledger operating draw against actual AI spend.
--
-- Append-only, same as audit_log.

create table if not exists model_call_log (
  id             uuid primary key default gen_random_uuid(),
  masjid_id      uuid references masjids(id) on delete set null,
  actor_user_id  uuid references users(id) on delete set null,
  feature        text not null,          -- 'lesson' | 'checkpoint' | 'assessment' | 'term_exam' | 'briefing'
  model          text not null,
  source         text not null default 'model',   -- 'model' | 'fallback'
  input_tokens   integer not null default 0,
  output_tokens  integer not null default 0,
  cost_usd       numeric(10,6) not null default 0,
  ok             boolean not null default true,
  at             timestamptz not null default now()
);

create index if not exists model_call_log_masjid_at_idx on model_call_log (masjid_id, at desc);
create index if not exists model_call_log_feature_at_idx on model_call_log (feature, at desc);

create or replace function model_call_log_is_append_only()
returns trigger language plpgsql as $$
begin
  raise exception 'model_call_log is append-only (%.%)', tg_op, tg_table_name;
end;
$$;

drop trigger if exists model_call_log_no_mutate on model_call_log;
create trigger model_call_log_no_mutate
  before update or delete on model_call_log
  for each row execute function model_call_log_is_append_only();
