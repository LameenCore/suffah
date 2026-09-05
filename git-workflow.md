# Skill: Git Workflow — Suffa

Hackathon timeline — optimize for always having a working `main`, not for clean history.

## Conventions

- Commit at the end of every completed checklist item / `progress/tasks/` task, not just at the end of a phase — small, frequent commits mean you can always roll back to a working state if something breaks close to demo time
- **Agents: commit AND `git push origin main` after every completed task, unprompted** (standing authorization in `CLAUDE.md`). Also commit+push when you claim a task and when you land a root-cause bug fix. Regenerate `progress/BOARD.md` before the task-done commit. Pull/rebase first if the push is rejected — another agent may have pushed.
- Commit messages: short, plain description of what now works — e.g. `student can complete lesson + checkpoint`, `admin pod assignment enforces 4-student cap` — optimize for "what changed and does it work," not conventional-commit formatting
- Branch only if two people are working on genuinely separate areas at once (e.g., one person on admin dashboard, one on the AI lesson/checkpoint logic) — merge back to `main` frequently, don't let branches live long
- Before the demo: tag or note the commit you're presenting from, so if you keep coding after and something breaks, you can instantly point back to the known-good state

## What not to bother with

- No PR review process — it's a hackathon, solo or small-team, ship directly to `main` with frequent small commits instead
- No elaborate `.gitignore` beyond the standard Next.js / node_modules / env file exclusions
- Don't worry about squashing or rewriting history — time spent on git hygiene is time not spent on the demo loop
