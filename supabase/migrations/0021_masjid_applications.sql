-- Multi-masjid onboarding (T63): a masjid that wants to run Suffa applies here;
-- a platform admin (T33) reviews and, on approval, provisions the tenant via
-- lib/platform/provision.ts.
--
-- Public submission goes through a service-role server action (validated +
-- captcha-free for the pilot); review/approve is platform-admin only. RLS is on
-- with NO policy — nothing reaches this table except the service-role paths.
--
-- Run: npm run migrate

create table if not exists masjid_applications (
  id                    uuid primary key default gen_random_uuid(),
  masjid_name           text not null,
  contact_name          text not null,
  contact_email         text not null,
  city                  text,
  note                  text,
  status                text not null default 'pending',   -- 'pending' | 'approved' | 'rejected'
  review_note           text,
  reviewed_by           uuid references users(id) on delete set null,
  provisioned_masjid_id uuid references masjids(id) on delete set null,
  created_at            timestamptz not null default now(),
  reviewed_at           timestamptz
);

create index if not exists masjid_applications_status_idx
  on masjid_applications (status, created_at desc);

alter table masjid_applications enable row level security;
-- no policy: service-role only.
