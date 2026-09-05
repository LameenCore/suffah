---
id: T36
title: Quebec Law 25 baseline (privacy)
phase: 10
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T04:15:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
outcome: >
  consent_records table (migration 0011, append-only) + lib/consent.ts
  (CONSENT_VERSION, four named purposes, grant/withdraw/active helpers) — verified
  live: grant→active, withdraw→inactive, history preserved, UPDATE blocked by the
  trigger. Self-serve export: /parent/privacy page + GET /parent/privacy/export
  returns a JSON attachment of the guardian + every linked child's account, pods,
  progress, results, compliance reports, community notes, consent history — tenant
  + relationship scoped, verified against the live DB. Right-to-erasure REQUEST
  flow files a support_requests row (category data-erasure) for the privacy officer
  + an audit entry; execution stays a deliberate human action. docs/privacy/
  law25-baseline.md: privacy-officer contact (operator placeholder), breach process
  (CAI notification + incident register), retention table, data-subject rights,
  cross-border summary, and an explicit open-items list.
commits: PLACEHOLDER36
depends_on: [T30]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
The product handles minors' education data in Quebec. Law 25 (not GDPR) is the  governing
regime: consent records, a privacy officer contact, breach process,  data-subject rights.

## Done when
- [x] Consent records per family (what data, what purpose, incl. AI processing) with
      timestamp + version — `consent_records` + `lib/consent.ts`
- [x] Self-serve data export (all of a family's data) + right-to-erasure request flow —
      `/parent/privacy` + `/parent/privacy/export`; erasure files a tracked request
- [x] Named privacy-officer contact + a documented breach-response process in docs/ —
      `docs/privacy/law25-baseline.md`

## Notes (owner appends)
- Consent purpose keys: curriculum, ai_instruction, compliance_record, retention.
  Bump `CONSENT_VERSION` in `lib/consent.ts` on any material change → guardian
  re-prompted. The student-account gate that consumes `hasActiveConsent()` is **T37**.
- Still owed against this baseline (enumerated in the doc's "Open items summary"):
  scripted right-to-erasure execution + free-text scrub; operator-set retention
  numbers + a cleanup job; guardian identity verification; the PIA for the
  cross-border briefing flow (ties to T39); confidentiality-incident register
  template. Operator must fill the privacy-officer name/email in `/privacy` and the
  doc before launch.
- Broadened `SupportCategory` with `data-erasure`; added the tone entry in
  `app/help/page.tsx` and `components/admin/SupportInbox.tsx` so the privacy officer
  sees erasure requests in the admin inbox.
