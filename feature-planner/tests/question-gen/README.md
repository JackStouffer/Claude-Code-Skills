# Question-generation test suite

Answers one question: **does the Phase-2 question generator (one Opus subagent,
medium effort, Write-only, no codebase access) produce good open questions for
all eight domains from just the plan-notes prompt?**

## The design under test

Phase 2 of the skill dispatches a single `fp-question-gen` subagent with the
prompt in `../../question-gen-prompt.md`: the full `plan-notes.md` contents plus
a description of each of the eight question domains. The subagent writes one JSON
file of up to six questions per domain, and the main agent asks the union of them
to the user. Fewer questions are assumed better; six is a cap, not a target.

This suite measures the risky link in that chain: **the quality of the questions
the constrained subagent produces.** The prompt is derived from the skill file
every run so it cannot drift.

## The subagent constraints (fixed by the design)

- **Model:** Opus, **effort:** medium.
- **Tools:** `Write` only. No `Read`, no `Bash`, no web. All context comes from
  the prompt. Pinned in `../../agents/fp-question-gen.md` (symlinked from
  `.claude/agents/` in this repo and from `~/.claude/agents/`).
- **Output:** one JSON file per domain; the agent's only reply is the paths.
  Questions never touch the transcript.

## Layout

```
question-gen/
  README.md       this file                                        tracked
  background.md   the fixed background-context fixture (a seed idea) tracked
  prompt.py       renders ../../question-gen-prompt.md for one rep    tracked
  judge.md        judge rubric; scores question quality per domain   tracked
  score.py        aggregates <runs>/rep-*/judge.json                 tracked
  .gitignore                                                         tracked
  runs/rep-N/     outputs of the design under test                   ignored
    <domain>.json   the eight question files
    prompt.md       the exact prompt the agent ran (record)
    judge.json      the judge's per-domain scores
  runs-control/         earlier arm: one inline Opus, <=4/dimension  ignored
  runs-fanout-sonnet/   earlier arm: eight Sonnet agents, one/domain ignored
  RESULTS.md      write-up of the run                                ignored
```

## Why the fixture is a seed idea, not a confirmed spec

The Phase-4 sibling suite feeds a *confirmed* spec, because Phase 4 writes the
plan after everything is decided. This suite tests Phase **2**, before decisions
exist, so `background.md` is a seed idea with real ambiguity left open in every
domain. Feed a decided spec here and there'd be nothing to ask. The fixture
deliberately spans all eight domains (a self-serve CSV contact importer).

## Procedure (orchestrator)

Judge with one strong model (Opus), same judge for every rep.

1. Per rep `N` (`mkdir -p runs/rep-N`):
   a. `python3 prompt.py "$PWD/runs/rep-N" > runs/rep-N/prompt.md`.
   b. Dispatch **one** `fp-question-gen` agent with the *contents* of that file
      pasted inline as its prompt (it has no Read tool). Pass `model: opus` on
      the dispatch as well, in case the session's agent def predates the pin.
      It writes `runs/rep-N/<key>.json` for all eight keys and replies with a
      `MODEL:` line plus the paths. Check the MODEL line.
   c. Claude Code loads agent defs at startup. If `fp-question-gen` is not an
      available agent type, restart the session.
2. Dispatch one judge per rep with `judge.md`, filling `{{BACKGROUND_PATH}}`
   (absolute path to `background.md`), `{{DOMAIN_FILES}}` (the eight
   `runs/rep-N/*.json` paths), and `{{OUT_PATH}}` = `runs/rep-N/judge.json`.
3. `python3 score.py` (or `python3 score.py runs-control` etc. for an older arm).
4. Write `RESULTS.md`, then carry the decision + numbers into `../../README.md`.

Five reps is the standard (single reps lie); a 1–2 rep pilot is fine to see
direction, labelled as a pilot.

## What the numbers mean (per domain, and overall)

- **useful** — mean count of genuinely worth-asking questions per domain. The
  headline. Compare it against `total`: a low useful/total ratio means padding.
- **accept-rate** — fraction of domain-sets the judge would send to the user
  roughly as-is. Primary bar.
- **offbase** — mean questions per domain that assume invented facts, are out of
  scope, already answered, or off-domain. A question built on a made-up premise
  actively misleads the user; watch it even if useful looks fine.
- **specif / assump** — 1–5: are questions concrete, and do they surface real
  undecided choices rather than trivia.
- **on-dom / non-red** — fraction on-domain and non-redundant. Redundancy across
  domain files counts, since the user sees the union.
- **opt-q** — 1–5 quality of the options offered (real distinct tradeoffs).

## The decision rule

The design holds if, over the reps run: accept-rate high across domains,
useful close to total (little padding), offbase near zero, non-redundant near
1.0 across the union, and specificity/assumption-surfacing high. The two earlier
arms are the reference points: the eight-Sonnet fan-out had the coverage
(44 useful) but paid in redundancy and invented premises; the single inline Opus
was clean but thin (24 useful). Record the outcome in `../../README.md`.
