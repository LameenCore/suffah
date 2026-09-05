---
name: research
description: >-
  Structured research before acting — when a task depends on domain knowledge,
  external facts, prior art, or "how is this normally done" that is not already
  in the repo or the conversation. Produces a dated findings note under
  docs/research/ with claims, evidence, and sources. Use it before writing code
  whose correctness rests on facts you would otherwise guess (a spec, a pricing
  number, a regulation, a convention, a library's real behaviour), and whenever
  the user says "research X" or "look into X first".
---

# Research

Guessing that reads as fact is the failure this skill prevents. The output is a
short, cited note another person (or a later session) can trust without redoing
the work.

## When to use

- The user says "research", "look into", "find out", "what's the standard for".
- You are about to hard-code a fact you are not certain of: a number, a limit, a
  date, a regulation, an API contract, a "best practice".
- A task names prior art or competitors ("how do other X do Y").
- You need to characterise a fuzzy concept precisely (e.g. "AI writing tells",
  "waqf", "Quebec home-instruction exemption").

Skip it for facts already established in the repo, the conversation, or basic
knowledge you would stake the task on.

## Procedure

1. **State the question.** One sentence. If it has parts, list them. Write down
   what a good answer lets you do next — that scopes how deep to go.
2. **Gather from cheapest source first.**
   - Repo: `Grep`/`Glob`/`Read` for anything already written down here.
   - Bundled docs: `node_modules/*/docs`, `references/`, skill files.
   - Web: `WebSearch` for orientation, then `WebFetch` the 2–4 best primary
     sources (official docs, standards, the original author). Prefer primary
     over listicles. Note the publish date — stale sources age badly for
     pricing, APIs, and law.
3. **Triangulate.** A claim needs agreement from two independent sources, or an
   explicit "single source, unverified" tag. Contradictions get recorded, not
   silently resolved.
4. **Synthesise** into `docs/research/<kebab-topic>.md` using the template below.
   One claim per bullet. Every non-obvious claim carries a source.
5. **Report back**: the answer in 2–4 sentences, the file path, and any claim
   that is still uncertain or that changes the plan.

## Output template

```markdown
# Research: <topic>

_Date: <YYYY-MM-DD> · Question: <the one-sentence question>_

## Answer (short)
<2–4 sentences: what to do with this>

## Findings
- <claim> — <source: title + URL or path> (<date if it matters>)
- <claim> — <source> · corroborated by <source 2>
- <claim> — SINGLE SOURCE, unverified — <source>

## Open questions / contradictions
- <what is still unknown, or where sources disagree and which you chose>

## Sources
1. <title> — <URL/path> — <accessed YYYY-MM-DD>
```

## Rules

- No claim without a source or an explicit "unverified" tag. "It is well known
  that…" is not a source.
- Quote the source's own words for anything precise (a number, a legal phrase, a
  definition). Paraphrase loses the precision that made research necessary.
- Keep the note to what the task needs. A research note is a tool, not an essay.
- If the research changes the plan, say so in the report — do not just proceed.
- Date the note. Facts rot; a reader needs to know how old this is.
