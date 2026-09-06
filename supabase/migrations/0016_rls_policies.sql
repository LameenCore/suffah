-- Row-level security: defense in depth for tenant isolation (T31).
--
-- Context: all *server* DB access uses the Supabase service-role client, which
-- has BYPASSRLS — so today the only tenant boundary is the `masjid_id` filter in
-- lib/db/*-queries.ts (the audit found one missing filter; it was fixed). RLS is
-- the second layer: if a query ever runs through the anon/authenticated client
-- (or a service-role key leaks to a context that somehow drops the bypass), the
-- database itself refuses cross-tenant rows.
--
-- Scope of THIS migration: enable RLS on every table + a SELECT policy per table
-- scoping rows to the caller's masjid (directly, or by joining up to it). Write
-- policies for the authenticated client are deliberately NOT added here — no
-- non-service client writes yet, and they should land together with the code
-- change that moves reads onto the authed client (T31 "done when" #2, a separate
-- architectural step). With no write policy, authenticated/anon writes are denied
-- by default, which is the safe direction.
--
-- service_role and the postgres migration user both bypass all of this.
--
-- Run: npm run migrate

-- ---------------------------------------------------------------------------
-- Helpers: resolve the current auth.uid() to their app identity.
-- SECURITY DEFINER so the function's own read of `users` is not itself subject
-- to the `users` RLS policy (which would recurse).
-- ---------------------------------------------------------------------------

create or replace function public.app_masjid_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select masjid_id from public.users where auth_id = auth.uid()
$$;

create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.users where auth_id = auth.uid()
$$;

revoke all on function public.app_masjid_id() from public;
revoke all on function public.app_role() from public;
grant execute on function public.app_masjid_id() to anon, authenticated, service_role;
grant execute on function public.app_role() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enable RLS on every application table (explicit allowlist — not a sweep over
-- pg_tables, so extension/operational tables like schema_migrations are left
-- alone). A table with RLS on and no policy is deny-all for anon/authenticated.
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'masjids','users','volunteers','pods','courses','units','pathway_nodes',
    'term_exams','pod_students','pod_progress','pod_briefings','pod_session_notes',
    'checkpoint_results','unit_assessment_results','term_exam_results',
    'lesson_progress','compliance_reports','parent_children','review_items',
    'tutor_messages','node_remediations','path_events','lesson_contributions',
    'pod_barakah_log','sponsorships','waqf_ledger','family_fee_status',
    'support_requests','audit_log','consent_records','model_call_log',
    'masjid_ai_budget'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- SELECT policies. Named `<table>_tenant_read`. authenticated only.
-- ---------------------------------------------------------------------------

-- the masjid row itself
drop policy if exists masjids_tenant_read on public.masjids;
create policy masjids_tenant_read on public.masjids
  for select to authenticated
  using (id = public.app_masjid_id());

-- tables with a direct masjid_id
do $$
declare t text;
begin
  foreach t in array array[
    'users','volunteers','pods','courses','waqf_ledger','family_fee_status',
    'support_requests','audit_log','consent_records','model_call_log',
    'masjid_ai_budget','pod_barakah_log','sponsorships'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_tenant_read', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (masjid_id = public.app_masjid_id())',
      t || '_tenant_read', t
    );
  end loop;
end $$;

-- tables scoped through a student (student_user_id -> users.masjid_id)
do $$
declare t text;
begin
  foreach t in array array[
    'checkpoint_results','unit_assessment_results','term_exam_results',
    'lesson_progress','compliance_reports','parent_children','review_items',
    'tutor_messages','node_remediations','path_events','pod_students'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_tenant_read', t);
    execute format($f$
      create policy %I on public.%I for select to authenticated
      using (exists (
        select 1 from public.users u
        where u.id = %I.student_user_id and u.masjid_id = public.app_masjid_id()
      ))
    $f$, t || '_tenant_read', t, t);
  end loop;
end $$;

-- tables scoped through a pod (pod_id -> pods.masjid_id)
do $$
declare t text;
begin
  foreach t in array array['pod_progress','pod_briefings','pod_session_notes']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_tenant_read', t);
    execute format($f$
      create policy %I on public.%I for select to authenticated
      using (exists (
        select 1 from public.pods p
        where p.id = %I.pod_id and p.masjid_id = public.app_masjid_id()
      ))
    $f$, t || '_tenant_read', t, t);
  end loop;
end $$;

-- curriculum content scoped through its course (course_id -> courses.masjid_id)
do $$
declare t text;
begin
  foreach t in array array['units','pathway_nodes','term_exams']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_tenant_read', t);
    execute format($f$
      create policy %I on public.%I for select to authenticated
      using (exists (
        select 1 from public.courses c
        where c.id = %I.course_id and c.masjid_id = public.app_masjid_id()
      ))
    $f$, t || '_tenant_read', t, t);
  end loop;
end $$;

-- lesson_contributions: node_id -> pathway_nodes.course_id -> courses.masjid_id
drop policy if exists lesson_contributions_tenant_read on public.lesson_contributions;
create policy lesson_contributions_tenant_read on public.lesson_contributions
  for select to authenticated
  using (exists (
    select 1
    from public.pathway_nodes n
    join public.courses c on c.id = n.course_id
    where n.id = lesson_contributions.node_id
      and c.masjid_id = public.app_masjid_id()
  ));
