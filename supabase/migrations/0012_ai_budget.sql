-- Per-masjid monthly AI budget (T56).
--
-- One row per masjid. `monthly_limit_usd` is the ceiling; a soft alert fires at
-- `soft_alert_ratio` of it, and when `hard_cap_enabled` the generators stop
-- calling the model past the limit and fall back to hand-authored content.

create table if not exists masjid_ai_budget (
  masjid_id         uuid primary key references masjids(id) on delete cascade,
  monthly_limit_usd numeric(10,2) not null default 25.00,
  soft_alert_ratio  numeric(4,3)  not null default 0.800,
  hard_cap_enabled  boolean       not null default true,
  updated_at        timestamptz   not null default now()
);

-- Default budget for the demo masjid.
insert into masjid_ai_budget (masjid_id, monthly_limit_usd)
values ('00000000-0000-0000-0000-000000000001', 25.00)
on conflict (masjid_id) do nothing;
