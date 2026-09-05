-- Suffa - link an app `users` row to a Supabase Auth account (T30).
--
-- Until now the app resolved the current user from a dev role cookie. Real auth
-- is Supabase Auth: a session identifies an `auth.users` row, and this column
-- maps it to the app-level `users` row that carries `role` + `masjid_id`.
--
-- Nullable: existing seeded users work until `npm run seed:auth` links them.
--
-- Run: npm run migrate  (or paste into the Supabase SQL editor).

alter table users
  add column if not exists auth_id uuid unique references auth.users(id) on delete set null;

create index if not exists users_auth_id_idx on users (auth_id);
