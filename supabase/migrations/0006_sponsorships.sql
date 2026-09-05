-- Suffa — waqf-to-outcome linking (T21, differentiator).
--
-- Maps a (mock) endowment/sadaqah contribution to the pod + unit it sponsored,
-- so a donor-facing transparency view can show a *learning outcome trace*, not
-- just fund flow. The mapping is illustrative — seeded, not derived from real
-- ledger rows (waqf_ledger ids are random). Outcomes ARE pulled from real
-- pod_progress / unit_assessment_results.
--
-- Run: npm run migrate  (or paste into the Supabase SQL editor).

create table if not exists sponsorships (
  id            uuid primary key default gen_random_uuid(),
  masjid_id     uuid not null references masjids(id) on delete cascade,
  sponsor_label text not null,            -- anonymized, e.g. "Founding endowment allocation"
  amount        numeric(12,2) not null,
  pod_id        uuid not null references pods(id) on delete cascade,
  unit_id       uuid not null references units(id) on delete cascade,
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists sponsorships_masjid_idx on sponsorships (masjid_id);
