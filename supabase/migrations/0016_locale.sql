-- Locale preference (T59). A per-user choice and a per-masjid default.
-- The suffa-locale cookie still wins for the current session; these are the
-- fallback when there's no cookie (fresh device, new sign-in).

alter table users   add column if not exists locale text;
alter table masjids add column if not exists default_locale text not null default 'en';

-- Quebec: default new masjids to French unless set otherwise.
-- (The demo masjid is left at the migration default so the walkthrough starts in
--  English; flip it in the admin settings or with:
--    update masjids set default_locale = 'fr' where id = '...';)
