# progress/ — living progress tracker

This directory is how **multiple agents (and future sessions) coordinate work** on Suffa
without stepping on each other. Read this file before touching anything here.

## Design in one sentence

**One file = one writer.** Every agent only ever edits (a) the *single* task file it has
claimed and (b) its *own* journal file. Nothing else. That is what makes concurrent work safe.

## Layout

```
progress/
  README.md          you are here — the protocol
  BOARD.md           derived snapshot for humans. NOT authoritative. Regenerate, never trust.
  tasks/             one file per task. THIS is the source of truth.
    T01-*.md
  journal/           one append-only file per session. Only its owning agent writes it.
    <session-id>.md
```

## Task file states

`status:` is one of:

| status    | meaning                                                        |
|-----------|---------------------------------------------------------------|
| `todo`    | unclaimed, ready to pick up (deps met)                        |
| `doing`   | an agent owns it right now                                    |
| `blocked` | can't proceed — see the `blocker:` line                       |
| `done`    | complete — see `outcome:` and `commits:` lines               |

## Protocol for an agent starting work

1. **Orient.** `ls progress/tasks/` and skim frontmatter (`status`, `depends_on`).
   Pick a `todo` task whose `depends_on` are all `done`. Prefer the lowest phase number.
2. **Claim it.** Edit *only that one task file*:
   - `status: doing`
   - `owner: <your session URL>`
   - `claimed: <ISO 8601 UTC>`
   - `updated: <today>`
3. **Verify the claim.** Immediately re-read the file. If `owner` is not you, another agent
   won the race — go back to step 1 and pick a different task. (Ties: leave it, move on.)
   Then commit + push the claim (`git commit` + `git push origin main`) so other agents see it.
4. **Work.** Append progress notes to `progress/journal/<your-session-id>.md` (create it if
   absent). This file is yours alone — never edit another agent's journal.
   **If you find a bug** (build break, wrong behaviour, bad data, broken assumption): pause
   the task, fix it at the root — no workarounds, no `// TODO` — commit + push the fix on its
   own, note it in your journal, then resume.
5. **Land it.** When the "Done when" boxes are all checked:
   - edit your task file: `status: done`, add `completed: <ISO 8601>`, `outcome: <1–2 lines>`,
     `commits: <short hashes>`
   - regenerate `BOARD.md`
   - `git add -A && git commit` (message per `git-workflow.md`) then `git push origin main` —
     **do this after every task, without being asked** (standing authorization in `CLAUDE.md`).
     If the push is rejected, `git pull --rebase` and push again — another agent got there first.
6. **If blocked:** set `status: blocked`, add `blocker: <what's needed>`, commit + push, stop
   touching it, and pick another task.

## Rules that keep agents from interfering

- **Never edit a task file you don't own** (except to read). The one exception: reclaiming a
  stale task (below).
- **Never edit another agent's journal file.**
- **BOARD.md is disposable.** If you regenerate it and hit a git conflict, discard and
  rebuild from `tasks/` — no information lives only in BOARD.md.
- **Stale reclaim:** if a task is `doing` but `claimed` is >90 minutes old *and* the owner's
  journal has no entry newer than that, any agent may reclaim it (set yourself as `owner`,
  bump `claimed`, add a journal note saying you took over).
- **Commit your claim and your completion** as their own small commits so other agents/
  sessions see them via `git log`. Keep `main` working.

## Regenerating BOARD.md

BOARD.md is a plain table built from every file in `tasks/`: id, phase, status, owner,
title. Rebuild it whenever you claim or finish a task, or whenever it looks stale.
