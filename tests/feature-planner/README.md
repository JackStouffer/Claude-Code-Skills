# Plan-writer test suite

Answers one question: **does the Phase-5 plan-writing subagent (`fp-plan-writer`)
turn a confirmed spec into an acceptable plan file?**

Phase 5 is the only part of the skill this measures. It is the one step that
runs in a fresh subagent context with a fixed, self-contained input (`plan-notes.md`)
and a fixed output shape (the plan structure), so it isolates cleanly: hold the
input spec and the prompt constant, judge the plan files. Phases 1–4 are
interactive and not measured here.

The agent runs on the model in its definition (`agents/fp-plan-writer.md`,
currently Opus). Sonnet is no longer tested: in the 2026-09 pilot and the
2026-11 trap-fixture pilot it invented specifics (schema fields, endpoint details,
reasons) in every rep and failed acceptance, so it is not a candidate.

## Layout

```
tests/feature-planner/
  README.md          this file                                        tracked
  spec.md            fixture 1: confirmed spec, consolidated section  tracked
  spec-conflicts.md  fixture 2: current plan-notes shape, with traps  tracked
  prompt.py          prints the Phase-5 prompt, derived from the skill tracked
  judge.md           judge rubric; writes judge.json per rep          tracked
  score.py           aggregates runs/<fixture>/rep-*/judge.json       tracked
  .gitignore                                                          tracked
  runs/<fixture>/    outputs, one dir per fixture (spec, conflicts)   ignored
    prompt.md          the generated Phase-5 prompt for this fixture
    rep-N/plan.md      the plan file
    rep-N/judge.json   the judge's scores
  RESULTS.md         write-up of the run                              ignored
```

Only the reusable harness is committed. The prompt is derived from `SKILL.md` and
`plan-structure.md` every run so it cannot drift. Run outputs and the write-up are
scratch.

## Procedure (orchestrator)

Five reps per fixture; single reps lie. Use one strong judge model (Opus) for
every rep. Run each fixture as its own set; results across fixtures are not
comparable.

0. `python3 prompt.py <fixture> > runs/<name>/prompt.md`. This is the skill's
   Phase-5 plan-writer prompt with the fixture and `plan-structure.md` pasted in,
   as the skill pastes `plan-notes.md` and `plan-structure.md`, and an
   `{{OUT_PATH}}` token. It exits non-zero if SKILL.md changed shape — fix
   `prompt.py`, don't hand-edit the output.
1. Per rep `N`: dispatch a `jacks-skills:fp-plan-writer` agent with the generated
   prompt, `{{OUT_PATH}}` = absolute path of `runs/<name>/rep-N/plan.md`. Do not
   override its model. The agent has only the Write tool, so it sees nothing but
   the prompt. Dispatch all reps in one message.
2. Per rep, dispatch one judge with `judge.md`, filling `{{SPEC_PATH}}` (absolute
   path to the fixture), `{{PLAN}}`, and `{{OUT_PATH}}` = `runs/<name>/rep-N/judge.json`.
   Tell it to read only `judge.md`, the fixture, and that plan.
3. `python3 score.py runs/<name>`.
4. Write `RESULTS.md`: judge model, reps, the tables, the failed reps, reading.

## What the numbers mean

Over all reps of one fixture:
- **accept-rate** — fraction of plans that are acceptable. `score.py` computes
  this, not the judge: a rep passes only if the judge said acceptable AND it has
  no missing sections, no fabricated items, and every open question, conflict,
  and undecided risk carried. Primary bar.
- **spec-cov** — fraction of the spec's checkable items the plan represents.
- **miss-sect** — mean count of required sections missing or empty.
- **fabricated** — mean count of things the plan states that the spec does not
  support, including any reason the spec does not give. One is a failure.
- **decision-q** — 1–5 quality of the Design Decisions section (what + why).
- **oq-carried** — fraction of plans that kept every deferred open question
  instead of silently resolving it.
- **conflicts** — fraction of plans that flagged every background conflict in
  Open Questions instead of picking a side.
- **risks** — fraction of plans that carried every undecided risk into Open
  Questions instead of choosing a mitigation.

`score.py` also lists each failed rep and why.

## The bar

The plan writer passes when accept-rate is 1.00 on both fixtures over five reps.
Any failed rep is a defect in the Phase-5 prompt, `plan-structure.md`, or the
agent definition — read the judge's `fabricated_items` and `missing_items` to
see which.

## Fixtures

Edit a fixture, then clear its `runs/<name>/`. Results across different specs
are not comparable.

### `spec.md`

An idempotent webhook ingestion endpoint, in an older notes shape with a
`## Consolidated spec (confirmed)` section and no `## Background`. Mid-size, with
enumerable decisions, explicit non-goals, decided edge cases, and two deferred
open questions, so coverage and fabrication are measurable.

### `spec-conflicts.md`: the trap fixture

It has the shape the skill's `plan-notes.md` has now (a `## Background` section,
domain sections, no consolidated section). Each trap tests one rule in
`judge.md`. The trap list lives here, not in the fixture, so the plan writer
cannot see it:

| Trap | Where | A plan fails it when |
|---|---|---|
| Contradiction between a planned doc and the code | Background: 30-day retention in `export-v2.md` vs the 7-day lifecycle rule in `exports.tf` | it states 7 or 30 days as fact without flagging the conflict in Open Questions |
| "Must" risk with no decision | Security: EU data must use the tenant's KMS key; SSE-S3 vs per-tenant keys not decided | it picks a mitigation, or drops the risk from Open Questions |
| Decision with no recorded reason | Core behavior: CSV only | it gives any reason instead of `Reason not recorded` (each one counts as fabricated) |
| Fact that only fits Current State | Background: `AuditLog.for_tenant()` tenant scoping already enforced | it drops the fact, or restates it as a new goal or decision instead of a tagged fact in Current State |
