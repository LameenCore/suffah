-- Shared / reference curriculum (T81).
--
-- A new masjid should be able to *adopt* a ready-made Secondary 1 curriculum
-- (Math / Seerah / AI Literacy) and then edit its own copy via /admin/authoring
-- (T50) — a fork, not a live link. The shared set lives in a sentinel "reference"
-- masjid so every FK, RLS policy and query keeps working unchanged; adopting is
-- just a deep copy from that masjid into the target.
--
-- This migration adds `masjids.kind` (so the reference tenant is excluded from
-- the platform rollup and analytics) and seeds the reference masjid row. Its
-- curriculum content is copied in from the demo masjid by
-- `npm run seed:reference` (scripts/seed-reference.ts) rather than inline SQL.
--
-- Run: npm run migrate

alter table masjids add column if not exists kind text not null default 'tenant';
-- 'tenant'    — a real masjid
-- 'reference' — the shared-curriculum sentinel; never a real customer

insert into masjids (id, name, kind, default_locale)
values (
  '00000000-0000-0000-0000-0000000000fe',
  'Suffa — shared curriculum (reference)',
  'reference',
  'en'
)
on conflict (id) do update set kind = 'reference';
