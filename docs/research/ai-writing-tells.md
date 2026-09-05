# Research: AI writing tells (and how they show up in this repo)

_Date: 2026-09-05 · Question: what are the recognisable tells of AI-generated
writing, in prose, docs, and code comments, so they can be found and removed from
this repo?_

## Answer (short)

The reliable tells cluster into vocabulary (buzzwords, inflated verbs), structure
("not X, but Y", rule-of-three, transition stacking, uniform sentence length),
punctuation (em-dash overuse), and substance (confident sentences that state
nothing). **No single tell convicts** — three or four converging in one passage
do. In *this* repo the vocabulary tells are nearly absent; the real fingerprint
is **em-dash overuse in code comments** (196 occurrences across 69 source files;
a human dev writes `-`, `:` or parentheses) plus occasional rule-of-three cadence
in comments and docs. Fix those two and the prose reads as hand-written.

## Findings

### Vocabulary

- Buzzword clusters flag AI when >3 per 500 words: "delve", "tapestry",
  "underscore", "showcase", "pivotal", "crucial", "testament", "seamless",
  "robust", "vibrant", "leverage" — Wikipedia:Signs_of_AI_writing; SlopDetector
  ("delve at ~25× its pre-ChatGPT frequency").
- Inflated verbs for plain ones: "utilize"→use, "facilitate"→help,
  "leverage"→use, "showcase"→show. Threshold: >1 per 300 words — SlopDetector.
- Copula avoidance: "serves as / stands as / functions as / represents" instead
  of "is". Marketing verbs for neutral ones: "features / offers / boasts" for
  "has" — Wikipedia.
- Vague connectors: "associated with", "in connection with" where a direct verb
  belongs — Wikipedia.

### Sentence & paragraph structure

- **"Not X, but Y" / "Not just X, it's Y" / "not only … but also"** — the
  contrast tic. Flag when the same frame repeats 3+ times in one document —
  SlopDetector; Wikipedia ("negative parallelisms").
- **Rule of three on autopilot** — every list has exactly three items; polished
  triplets ("efficient, scalable, and reliable"). Flag >1 per 200 words —
  SlopDetector; Wikipedia.
- **Transition stacking** — >half of paragraphs open with "Furthermore",
  "Moreover", "Additionally", "Ultimately" — SlopDetector.
- **Low burstiness** — uniform sentence length. Human std-dev/mean ≈ 0.6–1.2; AI
  ≈ 0.2–0.4 — SlopDetector.
- **Superficial-significance participles** — trailing "-ing" clauses that assert
  importance without evidence: "further enhancing its significance as a dynamic
  hub" — Wikipedia.
- **Outline-shaped conclusions** — "Despite its X, Y faces challenges typical
  of …" — Wikipedia.

### Punctuation & formatting

- **Em-dash overuse** — human baseline ≈ 3.7–10 per 1,000 words; GPT-4-class
  models ≈ 10–11, often surrounded by spaces. Flag >20 per 1,000 words —
  SlopDetector; Pangram; Wikipedia.
- Title Case in headings/labels where sentence case is normal; boldface
  scattered mid-sentence; emoji as bullets; curly quotes where straight are
  expected; `***` thematic breaks between every section — Wikipedia.

### Substance & tone

- **"Nothing you can restate"** — after a paragraph you cannot name one fact,
  number, date, or cause. Flag when >half of paragraphs fail this — SlopDetector.
- Fake authority — "studies have shown", "experts agree", "industry reports"
  with no citation — SlopDetector; Wikipedia.
- Pseudo-wisdom filler — sentences that survive deletion with no information
  loss ("the key is to find balance") — SlopDetector.
- Promotional / travel-guide tone in what should be neutral reference text —
  Wikipedia.
- Undue emphasis on legacy/significance — "stands as a testament to", "played a
  pivotal role", "reflecting broader trends" — Wikipedia.

### Code comments specifically

- The dominant failure is **comments that restate the code** ("// increment i by
  one") instead of explaining *why* — dev.to/keploy; Pluralsight. Google's
  internal AutoCommenter measured only ~54% of generated comments as useful.
- Secondary: comments drift out of sync with code over time; over-commenting
  trivial lines; a sudden shift in comment voice within one file — Pluralsight;
  Wikipedia ("pronounced style shift").

### Historical tells no longer reliable

Didactic "As an AI…" disclaimers, knowledge-cutoff caveats, section-summary
sentences, refusal boilerplate — common 2022–2024, largely gone now — Wikipedia.

## How this maps onto the repo

| Tell | Present here? | Action |
|---|---|---|
| Buzzwords / inflated verbs | Essentially none (grep: 0 clustered hits) | spot-check only |
| **Em-dash overuse in comments** | **Yes — 196 in 69 files** | replace `—` with `-`, `:`, `()`, or reword |
| Em-dash in UI strings | Some legitimate, some AI-cadence | case-by-case in user-facing text |
| "Not X, but Y" tic | Mild — ~8 in source, mostly meaningful contrasts | reword the few that are cadence not content |
| Rule-of-three cadence | Occasional in comments/docs | break the ones that are filler |
| Restated-code comments | Some ("// Wipe (FK cascade …)") | keep only the ones explaining *why* |
| Transition stacking / low burstiness | Minor in longer doc prose | light edit |
| Fake authority / pseudo-wisdom | Not in code; watch PRD/README | leave unless egregious |

Left untouched deliberately: `progress/journal/*` and `progress/tasks/*` are
append-only process history, not deliverables — rewriting them retroactively
would falsify the record.

## Open questions / contradictions

- Em-dashes are *correct* typography in polished prose; the tell is *density* and
  *use in code comments*, not the character itself. Judgment applies to
  user-facing strings; comments get the mechanical `—`→`-` pass.
- Sources disagree on whether the em-dash still signals anything (models were
  tuned away from it in 2025). Treated as: still a strong signal *in this
  codebase* because the density is far above any human-dev baseline.

## Sources

1. Wikipedia:Signs of AI writing — https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing — accessed 2026-09-05
2. Signs of AI Writing: 12 Patterns With Reproducible Thresholds — https://slopdetector.org/blog/signs-of-ai-writing — accessed 2026-09-05
3. 9 Signs of AI Writing, Backed by Data (Pangram) — https://www.pangram.com/signs-of-ai-writing — accessed 2026-09-05
4. The Impact of AI on Code Commenting — https://dev.to/keploy/the-impact-of-ai-on-code-commenting-and-software-documentation-4cnf — accessed 2026-09-05
5. Documenting and commenting code using AI (Pluralsight) — https://www.pluralsight.com/resources/blog/software-development/documenting-commenting-code-with-AI — accessed 2026-09-05
