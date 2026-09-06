-- RLS write policies for the `authenticated` client (T79).
--
-- 0016 enabled RLS + a SELECT policy per table. This adds INSERT / UPDATE /
-- DELETE policies so that IF a write ever runs through the anon/authenticated
-- client, the database enforces the same tenant + role rules the app code does.
--
-- Today every server write still goes through the service-role client
-- (BYPASSRLS), so this migration changes nothing at runtime — it only closes the
-- door for a future authed-client write path (and is proven by
-- `npm run check:rls`, which now also asserts a cross-tenant write is refused).
--
-- Model:
--   * "admin" writes (volunteer roster, courses, ledger, pods, curriculum,
--     memberships, briefings, reports) require app_role() = 'admin' in the
--     caller's own masjid.
--   * result / activity rows (checkpoint_results, lesson_progress, tutor_messages,
--     …) can be INSERTed by the student they belong to, or by an admin in that
--     masjid. No UPDATE/DELETE — these are append-only in practice.
--   * support_requests: any in-tenant user files their own; admins resolve.
--   * consent_records: an admin, or the guardian linked to the child. No
--     UPDATE/DELETE (DB trigger already enforces append-only).
--   * audit_log / model_call_log: NO write policy — append-only triggers guard
--     them and only service-role should ever write them.
--
-- Run: npm run migrate

-- ---------------------------------------------------------------------------
-- Helper: resolve auth.uid() -> public.users.id (for "is this row mine?" checks).
-- SECURITY DEFINER so it doesn't recurse through users' own RLS.
-- ---------------------------------------------------------------------------

create or replace function public.app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_id = auth.uid()
$$;

revoke all on function public.app_user_id() from public;
grant execute on function public.app_user_id() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Bucket A — admin writes on tables with a direct masjid_id.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  pred text := '(masjid_id = public.app_masjid_id() and public.app_role() = ''admin'')';
begin
  foreach t in array array[
    'volunteers','courses','waqf_ledger','masjid_ai_budget',
    'family_fee_status','sponsorships','pods','pod_barakah_log'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_delete', t);
    execute format('create policy %I on public.%I for insert to authenticated with check %s',
                   t || '_admin_insert', t, pred);
    execute format('create policy %I on public.%I for update to authenticated using %s with check %s',
                   t || '_admin_update', t, pred, pred);
    execute format('create policy %I on public.%I for delete to authenticated using %s',
                   t || '_admin_delete', t, pred);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Bucket B — admin writes on tables that reach their masjid through a join.
-- ---------------------------------------------------------------------------

-- via student_user_id -> users.masjid_id
do $$
declare
  t text;
  pred text;
begin
  foreach t in array array['pod_students','parent_children','compliance_reports']
  loop
    pred := format(
      '(exists (select 1 from public.users u where u.id = %I.student_user_id '
      || 'and u.masjid_id = public.app_masjid_id() and public.app_role() = ''admin''))',
      t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_delete', t);
    execute format('create policy %I on public.%I for insert to authenticated with check %s',
                   t || '_admin_insert', t, pred);
    execute format('create policy %I on public.%I for update to authenticated using %s with check %s',
                   t || '_admin_update', t, pred, pred);
    execute format('create policy %I on public.%I for delete to authenticated using %s',
                   t || '_admin_delete', t, pred);
  end loop;
end $$;

-- via pod_id -> pods.masjid_id
do $$
declare
  t text;
  pred text;
begin
  foreach t in array array['pod_progress','pod_briefings','pod_session_notes']
  loop
    pred := format(
      '(exists (select 1 from public.pods p where p.id = %I.pod_id '
      || 'and p.masjid_id = public.app_masjid_id() and public.app_role() = ''admin''))',
      t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_delete', t);
    execute format('create policy %I on public.%I for insert to authenticated with check %s',
                   t || '_admin_insert', t, pred);
    execute format('create policy %I on public.%I for update to authenticated using %s with check %s',
                   t || '_admin_update', t, pred, pred);
    execute format('create policy %I on public.%I for delete to authenticated using %s',
                   t || '_admin_delete', t, pred);
  end loop;
end $$;

-- via course_id -> courses.masjid_id
do $$
declare
  t text;
  pred text;
begin
  foreach t in array array['units','pathway_nodes','term_exams']
  loop
    pred := format(
      '(exists (select 1 from public.courses c where c.id = %I.course_id '
      || 'and c.masjid_id = public.app_masjid_id() and public.app_role() = ''admin''))',
      t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_delete', t);
    execute format('create policy %I on public.%I for insert to authenticated with check %s',
                   t || '_admin_insert', t, pred);
    execute format('create policy %I on public.%I for update to authenticated using %s with check %s',
                   t || '_admin_update', t, pred, pred);
    execute format('create policy %I on public.%I for delete to authenticated using %s',
                   t || '_admin_delete', t, pred);
  end loop;
end $$;

-- lesson_contributions: node_id -> pathway_nodes.course_id -> courses.masjid_id
drop policy if exists lesson_contributions_admin_insert on public.lesson_contributions;
drop policy if exists lesson_contributions_admin_update on public.lesson_contributions;
drop policy if exists lesson_contributions_admin_delete on public.lesson_contributions;

create policy lesson_contributions_admin_insert on public.lesson_contributions
  for insert to authenticated
  with check (exists (
    select 1 from public.pathway_nodes n
    join public.courses c on c.id = n.course_id
    where n.id = lesson_contributions.node_id
      and c.masjid_id = public.app_masjid_id()
      and public.app_role() = 'admin'
  ));
create policy lesson_contributions_admin_update on public.lesson_contributions
  for update to authenticated
  using (exists (
    select 1 from public.pathway_nodes n
    join public.courses c on c.id = n.course_id
    where n.id = lesson_contributions.node_id
      and c.masjid_id = public.app_masjid_id()
      and public.app_role() = 'admin'
  ));
create policy lesson_contributions_admin_delete on public.lesson_contributions
  for delete to authenticated
  using (exists (
    select 1 from public.pathway_nodes n
    join public.courses c on c.id = n.course_id
    where n.id = lesson_contributions.node_id
      and c.masjid_id = public.app_masjid_id()
      and public.app_role() = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- Bucket C — result / activity rows: INSERT by the student themself, or by an
-- admin in that student's masjid. No UPDATE / DELETE (append-only in practice;
-- some already have no-mutate triggers).
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  pred text;
begin
  foreach t in array array[
    'checkpoint_results','unit_assessment_results','term_exam_results',
    'lesson_progress','review_items','path_events','node_remediations','tutor_messages'
  ]
  loop
    pred := format(
      '(exists (select 1 from public.users u where u.id = %I.student_user_id '
      || 'and u.masjid_id = public.app_masjid_id() '
      || 'and (u.auth_id = auth.uid() or public.app_role() = ''admin'')))',
      t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_insert', t);
    execute format('create policy %I on public.%I for insert to authenticated with check %s',
                   t || '_owner_insert', t, pred);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Bucket D — special cases.
-- ---------------------------------------------------------------------------

-- users: update your own row, or an admin manages rows in their masjid.
drop policy if exists users_self_or_admin_update on public.users;
drop policy if exists users_admin_insert on public.users;
drop policy if exists users_admin_delete on public.users;

create policy users_self_or_admin_update on public.users
  for update to authenticated
  using (
    auth_id = auth.uid()
    or (masjid_id = public.app_masjid_id() and public.app_role() = 'admin')
  )
  with check (
    auth_id = auth.uid()
    or (masjid_id = public.app_masjid_id() and public.app_role() = 'admin')
  );
create policy users_admin_insert on public.users
  for insert to authenticated
  with check (masjid_id = public.app_masjid_id() and public.app_role() = 'admin');
create policy users_admin_delete on public.users
  for delete to authenticated
  using (masjid_id = public.app_masjid_id() and public.app_role() = 'admin');

-- masjids: an admin can update their own masjid row. No insert/delete for authed.
drop policy if exists masjids_admin_update on public.masjids;
create policy masjids_admin_update on public.masjids
  for update to authenticated
  using (id = public.app_masjid_id() and public.app_role() = 'admin')
  with check (id = public.app_masjid_id() and public.app_role() = 'admin');

-- support_requests: file your own; admins resolve (update).
drop policy if exists support_requests_self_insert on public.support_requests;
drop policy if exists support_requests_admin_update on public.support_requests;
create policy support_requests_self_insert on public.support_requests
  for insert to authenticated
  with check (
    masjid_id = public.app_masjid_id()
    and from_user_id = public.app_user_id()
  );
create policy support_requests_admin_update on public.support_requests
  for update to authenticated
  using (masjid_id = public.app_masjid_id() and public.app_role() = 'admin')
  with check (masjid_id = public.app_masjid_id() and public.app_role() = 'admin');

-- consent_records: an admin, or the guardian linked to the child. Append-only
-- (DB trigger blocks update/delete), so INSERT only.
drop policy if exists consent_records_guardian_or_admin_insert on public.consent_records;
create policy consent_records_guardian_or_admin_insert on public.consent_records
  for insert to authenticated
  with check (
    masjid_id = public.app_masjid_id()
    and (
      public.app_role() = 'admin'
      or exists (
        select 1 from public.parent_children pc
        where pc.student_user_id = consent_records.student_user_id
          and pc.parent_user_id = public.app_user_id()
      )
    )
  );

-- audit_log, model_call_log: intentionally NO write policy for `authenticated`.
-- Their no-mutate triggers + service-role-only inserts are the guard.
