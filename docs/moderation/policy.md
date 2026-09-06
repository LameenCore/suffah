# Pod board — content moderation & child-safety policy

_Tasks T47 (the board) + T41 (moderation). The pod board is the only place minors
produce content other people see, so it is built safe-by-default._

## Safety by design

- **Pod-scoped only.** A student posts to their own pod and sees only their own
  pod's board. RLS (`pod_board_posts_tenant_read`, migration 0023) plus an
  app-code pod check enforce this — no cross-pod visibility, ever.
- **No private messages.** There is no student-to-student DM anywhere in Suffa.
  Every message on the board is visible to the pod's volunteer and to masjid
  admins.
- **An adult is always in the thread.** Volunteers and admins can read every post
  — visible, held, or hidden — and can reply in any thread.
- **Pre-publish screening.** Every post is run through `lib/moderation.ts`
  before it publishes:
  - a short profanity list → the post is **held**
  - email / phone / URL / street-address patterns → the post is **held**, and
    its text is **masked** when shown back to the (student) author
  A held post is visible only to its author and to adults, with a note to the
  author that it is waiting for review. It never auto-publishes and never
  auto-deletes.
- **Report a post.** Any member can report a post. A report on a currently-visible
  post immediately **holds** it and adds it to the moderation queue.
- **Moderation queue.** `/admin/board` lists every held post across the masjid
  (with the flag reason, the pod, the author, and the report count). An admin
  **releases** a post (it publishes) or **hides** it (taken down). Both actions
  are written to the audit log (`board.post_released` / `board.post_hidden`).

## Retention

| Data | Retention | Basis |
|---|---|---|
| Board posts (`pod_board_posts`) | Kept while the pod is active; deleted with the pod / masjid (cascade). Suggested cleanup: purge posts older than **one school year** past the pod's last activity. | It is a working discussion space, not a record. |
| Hidden posts | Kept (not purged early) so a safeguarding review has the original text, then removed with the normal retention sweep. | Accountability. |
| Reports (`pod_board_reports`) | Kept as long as the post they reference. | Shows what was flagged and by whom. |
| Moderation actions | In `audit_log` (append-only), retained with the rest of the audit trail. | Accountability. |

The retention numbers are an **operator decision** — the table gives defensible
defaults. A scheduled cleanup job is a follow-on (same as the retention sweeps in
`docs/privacy/law25-baseline.md`).

## Takedown

- A guardian, student, volunteer, or admin can ask for a post to be removed. An
  admin hides it from `/admin/board` (or by opening the thread). Hiding is
  immediate and audit-logged.
- A safeguarding concern (a post suggesting harm, abuse, or contact outside the
  platform) is escalated to the masjid leadership per the masjid's own child-
  protection policy, and — where required — to the authorities. Suffa's role is
  to surface it quickly and preserve the evidence, not to adjudicate it.

## Known gaps / follow-ons

- The profanity list and PII patterns in `lib/moderation.ts` are deliberately
  small. Expand them from the moderation queue's real hits, not speculatively.
- No image / file uploads on the board — text only, by design, for now.
- The retention cleanup job is not built.
- French/Arabic profanity coverage is minimal; a real deployment needs a
  community-reviewed list per language.
