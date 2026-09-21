# Divergence test suite

Measures whether Phase A concept agents actually diverge, and compares the
current mechanism against any proposed replacement. Run it before editing the
skill: a change to Phase A needs a failing baseline first (see
superpowers:writing-skills). If the baseline does not fail, do not ship the change.

## Layout

```
tests/design-concepts/
  README.md            this file                                   tracked
  brief.md             fixed brief + territories                   tracked
  judge.md             judge rubric; writes judge.json per rep     tracked
  score.py             aggregates runs/<variant>/rep-*/judge.json  tracked
  baseline.py          prints the baseline prompt from SKILL.md    tracked
  variants/                                                        ignored
    current/           baseline; regenerate with baseline.py
      concept-agent.md
    <proposal>/        one folder per proposed Phase A
      concept-agent.md required
      planner.md       optional: a step that runs once per rep before agents
      *.py             optional: tools the variant needs
      README.md        optional: anything the orchestrator must do differently
  runs/<variant>/rep-N/   outputs                                  ignored
  RESULTS.md           write-up of the run                         ignored
```

Only the reusable harness is committed. The baseline prompt is derived from
SKILL.md every run, so it cannot drift and needs no maintenance. A proposal's
variant folder, its runs, and its write-up are scratch. What survives a test is
the decision and the numbers, recorded in `../../skills/design-concepts/README.md`
next to the research it
bears on. If a proposal is adopted, edit the SKILL.md template; the baseline
follows automatically.

## Conventions every variant must follow

- Prompts are templates with `{{PLACEHOLDER}}` tokens. `{{BRIEF}}`,
  `{{HOUSE_STYLE}}`, `{{AXIS}}` and `{{OUT_PATH}}` are always present and are
  filled from `brief.md`. Add others as needed and document them in the
  variant's README.
- First line of every agent's reply is `MODEL: <model id>` so the model can be
  audited from the transcript.
- Each concept agent writes exactly one spec file, `runs/<variant>/rep-N/0K-<slug>.md`,
  and returns only the MODEL line plus a one-line summary.
- The spec file must contain a table listing every option the agent committed to.
  The judge counts rows in that table, so the shape of the table is free but it
  must exist and be complete.
- Territories, brief, N, model, and the judge are identical across variants in a
  run. Only the Phase A mechanism varies.
- `frontend-design` is omitted. It governs aesthetics, not divergence.

## The baseline is generated, not stored

```bash
mkdir -p variants/current && python3 baseline.py > variants/current/concept-agent.md
```

`baseline.py` extracts the concept-agent template from SKILL.md, turns its
bracketed slots into `{{PLACEHOLDER}}` tokens, rewrites the output path to
`{{OUT_PATH}}`, drops the frontend-design line, and prepends the MODEL line. It
exits non-zero if the SKILL.md template has changed shape in a way it does not
recognise, which is the signal to update the script's rewrite list. Run it at the
start of every test run; never hand-edit the result.

## Procedure (orchestrator)

All agents run on the same model, chosen per run and recorded in RESULTS.md.
Do not use the orchestrator's own model for agents if it differs. Five reps
minimum per variant; single reps lie.

0. `mkdir -p variants/current && python3 baseline.py > variants/current/concept-agent.md`.
   Read `brief.md`; its brief, house style, and territory table fill `{{BRIEF}}`,
   `{{HOUSE_STYLE}}`, and `{{AXIS}}` in every prompt, including `judge.md`.
1. Per rep, generate a rep seed: `openssl rand -hex 16`. Variants that give each
   agent its own seed also need one `openssl rand -base64 24` per agent.
2. If the variant has `planner.md`, dispatch it first. Its output lands in
   `runs/<variant>/rep-N/`. Run any variant tool on that output.
3. Dispatch N concept agents in one message, each told to read
   `variants/<variant>/concept-agent.md` and apply the substitutions. Tell each
   agent not to read any other file under `tests/design-concepts/`.
4. When all N spec files exist, dispatch one judge per rep with `judge.md`,
   the N file paths, and `runs/<variant>/rep-N/judge.json` as output.
5. `python3 score.py` (or `python3 score.py path/to/runs` for another location).
6. Write `RESULTS.md`: model, brief, table, reading, decision. Then carry the
   decision and the table into `../../skills/design-concepts/README.md`;
   `RESULTS.md` is not committed.

## Metrics

- **same/pair**: design decisions where both concepts made materially the same
  choice, regardless of labelling. Lower is better. Primary metric.
- **div/pair**: LLM-judged pairwise diversity, 1-10, same scale as Zhang et al. 2026.
- **skel / meta**: pairs (of 3) sharing a layout skeleton or a metaphor.
- **realiz**: fraction of committed options visible in the concept body. Tests
  transmission, the failure mode Level 2 methods have.
- **enum-ovl**: options appearing in two or more agents' tables. Only meaningful
  when agents enumerate independently; the judge emits `null` otherwise.

## Adding a proposed change

1. `mkdir variants/<proposal>` and write `concept-agent.md`. Start from the
   output of `baseline.py` and change only what the proposal changes.
2. If the proposal adds a pre-step, write `planner.md` and any tool it needs.
   Put orchestrator-facing notes in `variants/<proposal>/README.md`.
3. Run `current` and `<proposal>` on the same brief, same model, same reps.
   Reuse existing `runs/current/` only if the brief, model, and baseline template
   are unchanged since that run.
4. Record the outcome in `RESULTS.md`, then in
   `../../skills/design-concepts/README.md`. Adopt the
   proposal only if `current` shows the failure the proposal claims to fix and
   the proposal fixes it. If adopted, edit the SKILL.md template and confirm
   `baseline.py` still runs clean.

## Changing the brief

Edit `brief.md`, then either clear `runs/` or point `score.py` at a fresh
directory. Results across briefs are not comparable.
