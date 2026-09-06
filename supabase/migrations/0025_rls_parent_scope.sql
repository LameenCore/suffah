-- Tighten the parent SELECT policies from masjid-scope to relationship-scope (T82).
--
-- 0016 scoped every student-record table to the caller's masjid. That's right for
-- admins, volunteers and the student themselves, but a *parent* should only see
-- their own linked children — not every family in the masjid — even via a raw
-- authed query. The dashboards already narrow with `parent_children`; this makes
-- the database enforce it too.
--
-- Pattern: keep the masjid scope, AND additionally require, when app_role() is
-- 'parent', that the row's student is linked to this parent in parent_children.
--
-- Run: npm run migrate

-- student-record tables scoped via student_user_id -> users
do $$
declare t text;
begin
  foreach t in array array[
    'checkpoint_results','unit_assessment_results','term_exam_results',
    'lesson_progress','compliance_reports','review_items','path_events',
    'node_remediations','tutor_messages'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_tenant_read', t);
    execute format($f$
      create policy %I on public.%I for select to authenticated
      using (
        exists (
          select 1 from public.users u
          where u.id = %I.student_user_id and u.masjid_id = public.app_masjid_id()
        )
        and (
          public.app_role() <> 'parent'
          or exists (
            select 1 from public.parent_children pc
            join public.users pu on pu.id = pc.parent_user_id
            where pc.student_user_id = %I.student_user_id
              and pu.auth_id = auth.uid()
          )
        )
      )
    $f$, t || '_tenant_read', t, t, t);
  end loop;
end $$;

-- parent_children: a parent sees only their own links
drop policy if exists parent_children_tenant_read on public.parent_children;
create policy parent_children_tenant_read on public.parent_children
  for select to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = parent_children.student_user_id and u.masjid_id = public.app_masjid_id()
    )
    and (
      public.app_role() <> 'parent'
      or exists (
        select 1 from public.users pu
        where pu.id = parent_children.parent_user_id and pu.auth_id = auth.uid()
      )
    )
  );

-- consent_records: a parent sees consent for their linked children
drop policy if exists consent_records_tenant_read on public.consent_records;
create policy consent_records_tenant_read on public.consent_records
  for select to authenticated
  using (
    masjid_id = public.app_masjid_id()
    and (
      public.app_role() <> 'parent'
      or exists (
        select 1 from public.parent_children pc
        join public.users pu on pu.id = pc.parent_user_id
        where pc.student_user_id = consent_records.student_user_id
          and pu.auth_id = auth.uid()
      )
    )
  );
