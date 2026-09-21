# Phase-4 model test suite

Answers one question: **can the Phase-4 plan-writing subagent run on Sonnet
instead of Opus and still produce acceptable plan files?**

Phase 4 is the only part of the skill this measures. It is the one step that
runs in a fresh subagent context with a fixed, self-contained input (`plan-notes.md`)
and a fixed output shape (the Plan structure), so it isolates cleanly: hold the
input spec and the prompt constant, vary only the model, judge the plan files.
Phases 1–3 are interactive and not model-swap candidates here.

RED/GREEN framing (see superpowers:writing-skills): **opus** is the baseline
(current behaviour), **sonnet** is the candidate. The suite is the test that
decides whether the downgrade holds. Do not change the SKILL.md default to Sonnet
unless this suite shows Sonnet's plans are acceptable and not meaningfully worse
than Opus's on the same spec.

## Layout

```
tests/feature-planner/
  README.md      this file                                          tracked
  spec.md        the fixed confirmed plan-notes.md fixture           tracked
  prompt.py      prints the Phase-4 prompt, derived from the skill   tracked
  judge.md       judge rubric; writes judge.json per rep             tracked
  score.py       aggregates runs/rep-*/judge.json into a verdict     tracked
  .gitignore                                                         tracked
  runs/rep-N/    outputs                                             ignored
    opus.md sonnet.md   the two plan files
    mapping.json        orchestrator's blind map {"A": model, "B": model}
    judge.json          the judge's scores, keyed A/B
    prompt.md           the generated Phase-4 prompt for this run
  RESULTS.md     write-up of the run                                 ignored
```

Only the reusable harness is committed. The prompt is derived from `SKILL.md` and
`plan-structure.md` every run so it cannot drift. Run outputs and the write-up are scratch — what survives a
run is the decision and the numbers, recorded in `../../skills/feature-planner/README.md`.

## Why blind, and why the plan file has no MODEL line

The real Phase-4 deliverable is a clean plan file with no model marker, so the
plan files here carry none. Each arm's model is reported in the agent's *reply*
(the `MODEL:` line the prompt demands) and recorded by the orchestrator in
`mapping.json`. The judge sees the two plans as `A`/`B` in randomised order and
never learns which model wrote which — otherwise it would score the label, not
the plan.

## Procedure (orchestrator)

Five reps minimum per run; single reps lie. The two arms are the models `opus`
and `sonnet`; everything else — spec, prompt, judge model — is identical across
arms and across reps. Pick one strong judge model (Opus) and use it for every rep.

0. `python3 prompt.py > /tmp/phase4-prompt.md`. This is the Phase-4 prompt with
   `{{NOTES_PATH}}` and `{{OUT_PATH}}` tokens, and the skill's
   `plan-structure.md` inlined where Phase 4 would tell the agent to read it. It
   exits non-zero if either file changed shape — fix `prompt.py`, don't
   hand-edit the output.
1. Per rep `N` (`mkdir -p runs/rep-N`, copy the prompt to `runs/rep-N/prompt.md`
   for the record):
   a. Dispatch **two** plan-writing agents in one message, one on `opus` and one
      on `sonnet`. Each gets the generated prompt with `{{NOTES_PATH}}` = absolute
      path to `spec.md` and `{{OUT_PATH}}` = `runs/rep-N/<model>.md`. Tell each
      agent to read only `spec.md`, nothing else under `tests/feature-planner/`.
   b. Record each agent's returned `MODEL:` line to confirm the arm actually ran
      on the intended model.
   c. Flip a coin: write `runs/rep-N/mapping.json` assigning `A`/`B` to the two
      model files in random order.
2. Dispatch one judge per rep with `judge.md`, filling `{{SPEC_PATH}}` (absolute
   path to `spec.md`), `{{PLAN_A}}` / `{{PLAN_B}}` from the mapping, and
   `{{OUT_PATH}}` = `runs/rep-N/judge.json`.
3. `python3 score.py`.
4. Write `RESULTS.md`: judge model, reps, the two tables, reading, decision. Then
   carry the decision and the numbers into `../../skills/feature-planner/README.md`;
   `RESULTS.md` is scratch.

## What the numbers mean

Per model, over all reps:
- **accept-rate** — fraction of that model's plans the judge called acceptable
  (all required sections present, high spec coverage, no fabrication, decisions
  carry rationale, open questions preserved). Primary bar.
- **spec-cov** — fraction of the spec's checkable items the plan represents.
- **miss-sect** — mean count of required sections missing or empty.
- **fabricated** — mean count of invented requirements/decisions not in the spec.
  The dangerous weak-model failure; watch this even if accept-rate looks fine.
- **decision-q** — 1–5 quality of the Design Decisions section (what + why).
- **oq-carried** — fraction of plans that kept both open questions instead of
  silently resolving them.
- **head-to-head** — blind preference count. Sonnet losing most reps means worse
  even if individually "acceptable"; roughly even means the downgrade holds.

## The decision rule

Adopt Sonnet only if, over ≥5 reps: Sonnet's accept-rate ≈ Opus's (and high),
Sonnet fabricates no more than Opus, and the head-to-head is roughly even (Sonnet
not preferred-against in a clear majority of reps). Any of: Sonnet dropping
required sections, inventing requirements, or losing most head-to-heads → keep
Opus. Record the outcome in `../../skills/feature-planner/README.md`.

## Changing the fixture

Edit `spec.md`, then clear `runs/` (or point `score.py` at a fresh dir). Results
across different specs are not comparable. The fixture is deliberately mid-size
with enumerable decisions, explicit non-goals, decided edge cases, and two
deferred open questions, so coverage and fabrication are measurable. To test
Sonnet on a harder spec, add a second fixture and run it as its own set of reps.
