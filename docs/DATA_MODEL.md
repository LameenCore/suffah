# Data Model - Suffa

Postgres schema, hackathon scope. Every table includes `masjid_id` for multi-tenancy (see ARCHITECTURE.md), even though the demo has one masjid.

## Core entities

### `masjids`
- `id`, `name`, `created_at`

### `users`
- `id`, `masjid_id`, `role` (`admin` | `parent` | `student`), `name`, `email`, `created_at`

### `volunteers`
- `id`, `masjid_id`, `user_id` (nullable - volunteer may not have login), `name`, `status` (`active` | `inactive` | `pending_vetting`), `certification_note`, `joined_at`, `left_at` (nullable - for churn log)

### `pods`
- `id`, `masjid_id`, `name`, `volunteer_id` (nullable - can be unassigned), `max_students` (default 4, enforced as hard cap), `created_at`

### `pod_students`
- `id`, `pod_id`, `student_user_id` - join table, one student can only be in one active pod per course-term

### `courses`
- `id`, `masjid_id`, `name` (`Math` | `Seerah` | `AI Literacy`), `grade_band` (e.g. `Secondary 1`)

### `pathway_nodes`
- `id`, `course_id`, `sequence_order`, `title`, `lesson_content` (generated + persisted, not regenerated per view), `checkpoint_content` (jsonb - the node's checkpoint questions, generated once from `lesson_content` and persisted; added in migration `0003`), `unit_id` (groups nodes into units for unit-assessment scoping)
- `lesson_content_fr`, `checkpoint_content_fr` (jsonb, nullable; migration `0027`) - the French copy of the generated content. English stays in the original column (the demo default); the readers in `lib/db/queries.ts` take a `locale` arg and return `*_fr` when it's set to `"fr"` and that copy exists, otherwise fall back to the English column. Generated on demand in French, English never touched.

### `units`
- `id`, `course_id`, `title`, `sequence_order`, `assessment_content` (jsonb - the unit assessment's questions, generated once from the unit's lessons and persisted; added in migration `0004`), `assessment_content_fr` (jsonb, nullable; migration `0027`, same fallback rule as `pathway_nodes`)

### `pod_progress`
- `id`, `pod_id`, `course_id`, `current_node_id` - this is the continuity record: what node a pod is on, per course, so a new volunteer can pick up instantly

### `lesson_progress`
- `id`, `student_user_id`, `pathway_node_id`, `status` (default `lesson_complete`), `completed_at`, unique (`student_user_id`, `pathway_node_id`)
- Per-student record that an individual finished reading a lesson node. `pod_progress` is pod-level (where the pod is); this is the per-student "self-paced within the pod's topic" record that gates the checkpoint. Added in migration `0002`.

### `unit_assessment_results`
- `id`, `student_user_id`, `unit_id`, `score`, `passed` (bool, threshold TBD - see PRD open question), `answer_data` (jsonb), `attempted_at`

### `term_exam_results`
- `id`, `student_user_id`, `course_id`, `term_label`, `score`, `answer_data` (jsonb), `attempted_at` - this is the primary compliance-report artifact

### `compliance_reports`
- `id`, `student_user_id`, `term_label`, `generated_at`, `report_data` (jsonb - aggregates checkpoint/unit/exam data at generation time), `exported` (bool)

### `waqf_ledger`
- `id`, `masjid_id`, `entry_type` (`principal_deposit` | `return_disbursed` | `sadaqah_received` | `scholarship_allocated`), `amount`, `note`, `created_at` - mock data for demo; principal entries should never be summed into "spendable" totals in any query

### `family_fee_status`
- `id`, `masjid_id`, `student_user_id`, `status` (`fee_paid` | `scholarship_covered`), `updated_at`

### Later migrations (0002+)
The core table set above is `0001_init.sql`. Subsequent migrations add:
`lesson_progress`, `pathway_nodes.checkpoint_content` / `units.assessment_content`,
the `*_content_fr` French-copy columns + `term_exams.exam_content_fr` +
`pod_briefings.locale` (migration `0027`, T59 item 6),
`parent_children`, `pod_session_notes` + `pod_briefings`, `sponsorships`,
`pod_barakah_log`, `term_exams`, `lesson_contributions`, `support_requests`,
`users.auth_id` (Supabase Auth link), and `audit_log`. See `supabase/migrations/`.

### `audit_log` (migration 0010)
- `id`, `masjid_id`, `actor_user_id` (nullable), `actor_role`, `action` (dotted
  verb, e.g. `pod.student_added`), `target_type`, `target_id`, `metadata` (jsonb,
  ids only - no PII), `at`
- **Append-only**: a `BEFORE UPDATE OR DELETE` trigger rejects any mutation. Every
  sensitive admin Server Action writes one entry; `/admin/audit` reads the trail.

### `model_call_log` (migration 0011)
- `id`, `masjid_id`, `actor_user_id`, `feature` (`lesson` | `checkpoint` |
  `assessment` | `term_exam` | `briefing`), `model`, `source` (`model` |
  `fallback`), `input_tokens`, `output_tokens`, `cost_usd`, `ok`, `at`
- **Append-only** (same trigger pattern). One row per generation attempt. Feeds
  `/admin/ai-spend`.

### `masjid_ai_budget` (migration 0012)
- `masjid_id` (pk), `monthly_limit_usd`, `soft_alert_ratio`, `hard_cap_enabled`,
  `updated_at`
- When `hard_cap_enabled` and month-to-date spend (from `model_call_log`) is over
  the limit, generators skip the model and serve hand-authored fallback content.

## Key relationships

- A **pod** has one volunteer (nullable) and up to 4 students (`pod_students`)
- A **pod** tracks progress **per course** via `pod_progress` - a pod's Math progress and Seerah progress are independent
- **Results** (checkpoint/unit/exam) are always tied to the **individual student**, even though pods move through curriculum together - this is what supports "self-paced within a shared pod topic"
- **Compliance reports** are generated per student, pulling from all three result tables - this is the artifact the PRD requires for Quebec's evaluation requirement

## Notes for the hackathon build

- Do not build out full historical versioning on `pathway_nodes` - a single persisted version per node is sufficient for the demo
- `waqf_ledger` only needs enough mock entries to populate a believable admin dashboard chart (principal balance flat/untouched, returns spent over time) - no real accounting logic required
- Passing thresholds (`unit_assessment_results.passed`, exam pass/fail if needed) are an open question in the PRD - default to 70% if not resolved before build starts
