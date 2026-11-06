# Test scenario — over-engineering-review

Compares the skill against a short one-line-per-finding prompt
(`short-plugin/`) and a no-guidance control, on a real squash-merged PR.

## Fixture

`trust-team-care-service` at `177954f` ("Jack/encounter admin", 99 files,
+11.5k/−1.9k). Build an isolated clone so reviewers can't see later commits:

```bash
git clone -q --shared --no-checkout <trust-team-care-service> fixture && cd fixture
git checkout -q -b jack/encounter-admin 177954f; git branch -f main 177954f^
# delete every other branch, the origin remote, and tags
cp <trust-team-care-service>/{CLAUDE.md,AGENTS.md} .   # gitignored upstream
git log -1 --format=%B HEAD > ../pr-description.md
```

## Run protocol

```bash
bash run-all.sh <fixture> <pr-description.md> <out> skill:1 skill:2 skill:3 short:1 ... control:3
python3 report.py <out>
```

Every arm gets the same text: "review jack/encounter-admin against main for
over-engineering" plus the PR description. The skill arm calls
`/jacks-skills:over-engineering-review`, the short arm calls
`/oe-short:over-engineering-short`, the control gets the text alone. Each arm
loads only its own plugin. With jacks-skills loaded, the control auto-triggers
the skill. `--setting-sources project` keeps user hooks (ponytail, routing)
out.

Score by pooling every finding from every report, deduping, and having fresh
judges grade each one blind against the code: VALID (with HIGH/MED/LOW
impact), NIT (true but under ~5 lines or cosmetic), or INVALID.

## Answer key

The author's follow-up branch `jack/annotation-simplification` has 8
simplification commits. Only one touches code this diff added: `23b12a9`
folds the 11 typed audit detail tables into one wide event table (−480/+502).

## Round 1 results (2026-10-17, Opus)

51 unique findings. Each judge graded its batch twice, and the two passes
disagreed a lot on borderline items, so both are shown. Value = 3/2/1 per
HIGH/MED/LOW VALID finding.

| Arm | Reps | Findings/run | VALID/run (p1 / p2) | NIT share (p1 / p2) | Value/run (p1 / p2) | Typed audit tables | Cost/run |
|---|---|---|---|---|---|---|---|
| skill | 5¹ | 3.6 | 1.4 / 3.0 | 11% / 17% | 2.4 / 6.0 | 0/5 found, 4/5 called it justified | $0.98–1.35 |
| short | 5 | 16 | 9.2 / 4.2 | 38% / 71% | 12.4 / 7.4 | 0/5 found, 2/5 called it justified | $0.91–2.98 |
| control | 3 | 13 | 7.0 / 7.3 | 17% / 25% | 12.7 / 13.7 | **3/3 found** | $1.38–1.66 |

¹ Three explicit runs, plus two first-round control runs that auto-triggered
the skill.

Robust across both passes: the skill has the lowest value per run, and the
control has the highest or ties for it. The short prompt beats the skill but
does not clearly beat no guidance.

What happened:
- **Skill: precise but narrow.** Every run returned the same 3–4 findings
  (history-state search cache, intake filters, doubled timeout). The verifier
  correctly dropped `live_task_run_ids`. The requirement gate is the failure.
  The PR description is written by the author and lists the design ("typed
  child tables per action family"). Step 1 turns that into the requirement,
  and then the biggest real cut is "required" by definition.
- **Short: wide, noisy at the low end.** It has the most findings, but 38–71%
  of each report is NITs from the `shrink`/`reuse` tags (3-line zips, constant
  hoisting, shared exception bases). The `net:` totals ran about 1.5–2× the judged lines. Format
  compliance was 5/5. Three of five runs fanned out to subagents on their own,
  and those had the best recall.
- **Control: only arm to see the design.** It flagged the typed tables (and
  the `before_flush` guard) every time. It also had the most INVALID findings,
  ran long, and mixed in scope-creep notes and one bug claim.

Caveats: one fixture; judges were single LLM passes and flipped on borderline
items when re-asked (B4, B9, B12); the answer key has one in-scope item.
