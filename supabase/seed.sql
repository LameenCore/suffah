-- Suffa — demo seed data (hackathon).
-- Run after 0001_init.sql. Idempotent: clears the demo masjid first.
--
-- Fixed UUIDs so the app (lib/auth demo users, Phase 2 queries) can reference
-- rows directly. One masjid, one pod of 4 students, one volunteer, three
-- courses each with one unit and a short pathway.

begin;

delete from masjids where id = '00000000-0000-0000-0000-000000000001';

-- Tenancy + people ------------------------------------------------------------

insert into masjids (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Masjid As-Suffa (Demo)');

insert into users (id, masjid_id, role, name, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'admin',   'Masjid Admin',          'admin@suffa.demo'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000001', 'parent',  'Parent (Demo Family)',  'parent@suffa.demo'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000001', 'student', 'Yusuf (Secondary 1)',   'yusuf@suffa.demo'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-000000000001', 'student', 'Maryam (Secondary 1)',  'maryam@suffa.demo'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000001', 'student', 'Idris (Secondary 1)',   'idris@suffa.demo'),
  ('00000000-0000-0000-0000-0000000000c4', '00000000-0000-0000-0000-000000000001', 'student', 'Safiya (Secondary 1)',  'safiya@suffa.demo');

insert into volunteers (id, masjid_id, user_id, name, status, certification_note, joined_at, left_at) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000001', null, 'Br. Kareem', 'active',   'CEGEP math tutor; reference check on file (mock).', now() - interval '40 days',  null),
  -- Departed volunteer — seeds a non-empty churn log (T15). Her pod kept its
  -- pod_progress and was picked up by Br. Kareem.
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-000000000001', null, 'Sr. Amina',  'inactive', 'Undergrad education student; moved cities.',        now() - interval '150 days', now() - interval '20 days');

-- Pod -----------------------------------------------------------------------

insert into pods (id, masjid_id, name, volunteer_id) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000001', 'Pod Al-Farabi', '00000000-0000-0000-0000-0000000000d1');

insert into pod_students (pod_id, student_user_id) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c2'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c3'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c4');

-- Courses + curriculum ----------------------------------------------------------

insert into courses (id, masjid_id, name, grade_band) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000001', 'Math',        'Secondary 1'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000001', 'Seerah',      'Secondary 1'),
  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-000000000001', 'AI Literacy', 'Secondary 1');

insert into units (id, course_id, title, sequence_order) values
  ('00000000-0000-0000-0000-000000010001', '00000000-0000-0000-0000-0000000000f1', 'Operations with Integers',        1),
  ('00000000-0000-0000-0000-000000010002', '00000000-0000-0000-0000-0000000000f2', 'The Meccan Period',               1),
  ('00000000-0000-0000-0000-000000010003', '00000000-0000-0000-0000-0000000000f3', 'What a Model Actually Does',       1);

-- Math pathway (maps to Quebec Sec 1 arithmetic progression)
insert into pathway_nodes (id, course_id, unit_id, sequence_order, title) values
  ('00000000-0000-0000-0000-000000020001', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000010001', 1, 'Adding and subtracting integers'),
  ('00000000-0000-0000-0000-000000020002', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000010001', 2, 'Multiplying and dividing integers'),
  ('00000000-0000-0000-0000-000000020003', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000010001', 3, 'Order of operations with integers');

-- Seerah pathway
insert into pathway_nodes (id, course_id, unit_id, sequence_order, title) values
  ('00000000-0000-0000-0000-000000020101', '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000010002', 1, 'Mecca before the revelation'),
  ('00000000-0000-0000-0000-000000020102', '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000010002', 2, 'The first revelation'),
  ('00000000-0000-0000-0000-000000020103', '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000010002', 3, 'The early community and its trials');

-- AI Literacy pathway
insert into pathway_nodes (id, course_id, unit_id, sequence_order, title) values
  ('00000000-0000-0000-0000-000000020201', '00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-000000010003', 1, 'Prediction, not knowledge'),
  ('00000000-0000-0000-0000-000000020202', '00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-000000010003', 2, 'Training data and where it comes from'),
  ('00000000-0000-0000-0000-000000020203', '00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-000000010003', 3, 'Why models get things confidently wrong');

-- Pod continuity: pod is on node 1 of each course
insert into pod_progress (pod_id, course_id, current_node_id) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000020001'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000020101'),
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-000000020201');

-- Funding (mock) --------------------------------------------------------------

-- Mock ledger — no payment processing. Story: principal stays locked at 250k;
-- only the returns are spent (rising quarterly operating draws); sadaqah tops up
-- the scholarship pool. Principal must never be summed into "spendable" totals.
insert into waqf_ledger (masjid_id, entry_type, amount, note, created_at) values
  ('00000000-0000-0000-0000-000000000001', 'principal_deposit',     250000.00, 'Founding waqf endowment (locked principal)',            now() - interval '15 months'),
  ('00000000-0000-0000-0000-000000000001', 'return_disbursed',       -3000.00, 'Operating draw — hosting + pod coordination',           now() - interval '13 months'),
  ('00000000-0000-0000-0000-000000000001', 'return_disbursed',       -3150.00, 'Operating draw',                                       now() - interval '10 months'),
  ('00000000-0000-0000-0000-000000000001', 'return_disbursed',       -3300.00, 'Operating draw',                                       now() - interval '7 months'),
  ('00000000-0000-0000-0000-000000000001', 'return_disbursed',       -3450.00, 'Operating draw',                                       now() - interval '4 months'),
  ('00000000-0000-0000-0000-000000000001', 'return_disbursed',       -3600.00, 'Operating draw',                                       now() - interval '1 month'),
  ('00000000-0000-0000-0000-000000000001', 'sadaqah_received',        2000.00, 'Eid al-Adha giving campaign',                          now() - interval '11 months'),
  ('00000000-0000-0000-0000-000000000001', 'sadaqah_received',        5000.00, 'Ramadan scholarship drive',                            now() - interval '5 months'),
  ('00000000-0000-0000-0000-000000000001', 'sadaqah_received',        1200.00, 'Weekly jumu''ah sadaqah (aggregated)',                  now() - interval '1 month'),
  ('00000000-0000-0000-0000-000000000001', 'scholarship_allocated',  -1200.00, 'Safiya — full fee scholarship (Term 1)',                now() - interval '6 months'),
  ('00000000-0000-0000-0000-000000000001', 'scholarship_allocated',  -1200.00, 'Safiya — full fee scholarship (Term 2)',                now() - interval '1 month');

insert into family_fee_status (masjid_id, student_user_id, status) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c1', 'fee_paid'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c2', 'fee_paid'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c3', 'fee_paid'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c4', 'scholarship_covered');

-- Family link: the demo parent monitors Yusuf (the student who moves through the
-- playground in the demo). parent_children is created by migration 0005.
insert into parent_children (parent_user_id, student_user_id) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1');

-- Waqf-to-outcome links (T21) — illustrative mapping: contribution → pod + unit
-- it sponsored. sponsorships is created by migration 0006. Outcomes are read
-- from real pod_progress / unit_assessment_results at view time.
insert into sponsorships (masjid_id, sponsor_label, amount, pod_id, unit_id, note) values
  ('00000000-0000-0000-0000-000000000001', 'Founding endowment allocation', 1500.00, '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000010001', 'Sponsors Pod Al-Farabi through the integers unit (Math).'),
  ('00000000-0000-0000-0000-000000000001', 'Ramadan drive — anonymous',     900.00, '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000010002', 'Sponsors the Meccan Period unit (Seerah).'),
  ('00000000-0000-0000-0000-000000000001', 'Local family gift',             750.00, '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000010003', 'Sponsors the AI-literacy intro unit.');

-- Barakah notes (T23) — pod_barakah_log is created by migration 0007. Short
-- observations, never scores. student_user_id null = whole-pod note.
insert into pod_barakah_log (masjid_id, pod_id, student_user_id, indicator, note, recorded_by, recorded_at) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1', null,                                     'attendance',  'Full pod present for all four sessions this week.',                    'Br. Kareem', now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1', null,                                     'adab',        'Circle settled quickly; made du''a together before starting.',         'Br. Kareem', now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c1', 'cooperation', 'Helped Idris work through sign errors without being asked.',            'Br. Kareem', now() - interval '6 days'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c1', 'reflection',  'Thoughtful reflection on what "prediction, not knowledge" means.',      'Br. Kareem', now() - interval '9 days'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000c2', 'cooperation', 'Maryam slowed down to check her work and explained a step to Safiya.', 'Br. Kareem', now() - interval '6 days');

commit;
