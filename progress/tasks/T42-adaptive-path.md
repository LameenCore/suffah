---
id: T42
title: Adaptive path: remediation branch + skip-ahead
phase: 11
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T09:30:00Z
completed: 2026-09-06T10:15:00Z
updated: 2026-09-05
outcome: |
  migration 0015_adaptive_path: node_remediations (cached re-teach per
  student+node) + path_events (remediation_shown | remediation_passed |
  fast_track_suggested).
  REMEDIATION BRANCH (full): lib/ai/remediation.ts getOrCreateRemediation - on a
  2nd checkpoint miss, builds a focused re-teach from the lesson + the SPECIFIC
  questions missed (objective grading gives us the ids -> prompts), structured
  output {summary, points[], examples[]}, budget-gated + logged (feature
  "remediation") + fallback. gradeCheckpoint now returns `remediation` on the
  triggering fail; the Checkpoint component renders it inline above the retry
  button ("I've read this - try again"). recordRemediationPassed on the
  eventual pass.
  FAST-TRACK (signal, not auto-skip - pods advance together): a cold first-try
  pass with score >= 0.9 writes fast_track_suggested for the next node;
  /admin/pods shows a "Ready to move faster" banner (getFastTrackSuggestions).
  PATH SHOWN: ComplianceReport.pathHistory (DB path) -> "Path taken" section in
  ComplianceReportView (parent + admin).
  demo:reset seeds Idris' re-teach + Safiya's fast-track. Verified end to end via
  script: fail -> fail -> remediation (real AI re-teach on sign rules) -> pass ->
  remediation_passed; banners render. build + lint + tsc + 62 tests +
  check:integrity green.
commits: fe35dca
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
The PRD names a 'remedial branch decision' but the built loop just gates on  pass/fail.
Within objective grading we can still branch: a failed checkpoint  routes to a targeted re-
teach; a high score can skip a node.

## Done when
- [x] On the 2nd checkpoint miss: an AI re-teach focused on the missed questions, shown
      before the retry (same checkpoint - a fresh variant would be a 2nd model call per
      retry; the re-teach targets the gap directly instead)
- [~] Strong cold pass -> fast_track_suggested for the next node, surfaced on /admin/pods.
      NOT an auto-skip: pod_progress is pod-level (pods move together), so an individual
      "skip" needs per-student positioning - that's T43 (skill tree). The admin advances
      the pod.
- [x] path_events persisted; "Path taken" section on the compliance view (parent + admin)

## Notes (owner appends)
- 2026-09-05: FAST_TRACK_THRESHOLD = 0.9, first-attempt only. To make skip-ahead
  actually skip, add a per-student current-node override (student_progress) and
  branch getPlayground on it - deferred with T43.
- The re-teach is cached in node_remediations; a student who keeps missing after
  it sees the same re-teach (no regen loop). Force-regen exists in the lib.
