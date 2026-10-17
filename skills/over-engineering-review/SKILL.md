---
name: over-engineering-review
description: >
  Review the changes on the current branch for over-engineering — unnecessary abstraction,
  speculative generality, needless indirection, and complexity that exceeds the problem.
  Triggers on /jacks-skills:over-engineering-review. Pass context about WHY the changes were made as
  arguments: a Jira ticket key, a Confluence page URL/ID, an ADO PR link, or a plain-text
  description. The skill fetches that context before reviewing.
---

# Over-Engineering Review

## Overview

Review the user's stated code for one thing only: places where the change is **more
complicated than the problem it solves**. Not bugs, not style: over-engineering.

**Core principle:** A critique of the "what" is worthless without the "why." You cannot
judge whether an abstraction is speculative unless you know the actual requirement it was
built for. So you MUST obtain the intent behind the changes before you review a single line.
The requirement that justifies (or fails to justify) a construct comes from the ticket, the
design doc, or the author — not from guessing.

## Inputs

`$ARGUMENTS` is context describing **why** the branch's changes were made. It may be:

- A Jira ticket key (e.g. `ML-2438`)
- A Confluence page URL or numeric page ID
- An ADO PR link or number
- Plain-text describing the requirement/intent
- Empty

## Rules

Obey these in order. If you break one, the review is invalid no matter how good the rest is.

1. **Gate on the requirement.** Do not review a single line until you have the stated
   requirement from Step 1. Never proceed on your own guess — only the user may choose to
   review context-free.
2. **Every finding must survive verification.** Ground each finding in the Step 1
   requirement or a real current caller, and keep only findings that come back SURVIVES from
   Step 4. A hypothetical future need is never a reason to keep complexity.
3. **Never manufacture findings.** "Appropriately scoped" is a valid, good result. Do not
   pad the list to look thorough; report fewer findings, or none.

## Process

### Step 1: Gather the intent — do this BEFORE reading the diff

You must have the requirement in hand before reviewing. Resolve context in this order:

1. **If `$ARGUMENTS` names a reference, fetch it:**
   - Jira key (e.g. `ML-2438`) → `Skill("dataops-assistant:jira-issue-reader")`
   - Confluence page URL or ID → `Skill("dataops-assistant:confluence-page-reader")`
   - ADO PR link/number → `Task(subagent_type: "dataops-assistant:ado-pr-reader")`
   - Plain-text intent → use it directly as the requirement.

2. **If `$ARGUMENTS` is empty, mine the branch for references.** Read the commit
   messages and branch name for ticket keys (this repo tags commits like `[ML-2438]`)
   and any linked PR. Fetch whatever you find via the tools above.

   ```bash
   MERGE_BASE=$(git merge-base HEAD main 2>/dev/null || git merge-base HEAD master)
   git log "$MERGE_BASE"..HEAD --format='%s%n%b'
   ```

3. **If you still have no requirement, STOP and ask the user** via `AskUserQuestion`.
   Do not proceed on a guess. Offer options like "Paste the ticket/doc", "It's described
   in the commit messages — use those", or "Review with no external context (findings will
   be lower-confidence)". Only the last option lets the review run context-free, and it must
   be the user's explicit choice — never yours.

**This step is non-negotiable. If you find yourself about to review the diff without a
stated requirement, you are doing it wrong — go back to Step 1.**

Write down, in one or two sentences, the **actual requirement this branch satisfies**. This
sentence is the yardstick for every finding below.

### Step 2: Set the Review Scope

Gather the limited scope that the user specified in step one.

If it's a diff, then diff against the base branch and scope the review **strictly to the changed
lines and the code they directly touch**. Do not review pre-existing code the branch didn't change.

```bash
git diff "$MERGE_BASE"..HEAD
git diff --name-only "$MERGE_BASE"..HEAD
```

If it's a file, a function, or some other limited section of the code, then search for that item
and read it in full for the context.

### Step 3: Review each non-trivial construct against the requirement

Use a pragmatic maintainer's lens: prefer the simplest readable design that satisfies the
requirement from Step 1, **without speculative extensibility**. Ignore bugs and style
entirely. Your only job is to find complexity that exceeds the problem.

For every non-trivial construct introduced in the diff — a new abstraction, layer,
interface, generic, config knob, factory, wrapper, base class, hook, indirection, or
dependency — ask: **"Couldn't we just do X instead?"** Brainstorm the simplest thing that
satisfies the *present* requirement, not a hypothetical future one. Concretely check for:

- Abstraction with a single caller / single implementation (interface, base class, or
  strategy pattern serving exactly one concrete case)
- Generality built for requirements that don't exist yet (speculative config, extension
  points, "we might need this later" flags)
- Layers that only pass data through without transforming it (mappers, DTOs, wrappers,
  service classes that just delegate)
- Hand-rolled logic that duplicates a standard library / framework feature
- Design patterns applied where a plain function or literal would do
- Premature optimization, caching, or concurrency the workload doesn't warrant
- Indirection that makes the reader jump through files to follow one code path
- New dependencies pulled in for something small and self-contained

### Step 4: Verify the candidate findings (the FILTER) — do this BEFORE ranking

Every candidate finding from Step 3 is a *hypothesis* that the code is more complex than
the requirement demands. LLM reviewers systematically over-flag requirement conformance, so
each hypothesis must survive an independent check before it reaches the report. Run **one**
fresh `jacks-skills:over-engineering-verifier` agent on all the candidates at once — the
pass that generated the findings is anchored to them, and a clean context is what removes
that bias. This agent ships with this plugin. If Step 3 produced no candidates, skip this
step.

If `jacks-skills:over-engineering-verifier` is not an available agent type, stop. Tell the
user that the `jacks-skills` plugin is not fully installed or enabled, and to reinstall or
enable it and restart the session.

```
Task(subagent_type: "jacks-skills:over-engineering-verifier", prompt: "<the inputs below>")
```

Pass exactly these inputs and nothing else. In particular, do **not** pass the Step 3
reasoning that produced any finding — that rationalization is exactly what the fresh context
exists to strip out.

1. **THE REQUIREMENT** — the requirement from Step 1, quoted verbatim, once. The verifier's
   only yardstick.
2. **THE FINDINGS** — a numbered list (`F1`, `F2`, …), one entry per candidate, each with:
   - **THE CONSTRUCT UNDER REVIEW** — file and specific changed line(s) (e.g.
     `runner.py:88-104`) and what was introduced. The verifier reads the file and its call
     sites itself before judging.
   - **THE PROPOSED SIMPLER ALTERNATIVE** — the "Couldn't we just…" sketch from Step 3.

The verifier returns one block per finding, in the same order:

```
F1
VERDICT: SURVIVES | DROP
REASON: <=2 sentences.
```

If a finding has no verdict block in the reply, treat it as DROP. Keep only the findings
that come back **SURVIVES**. Drop the rest. Note the count of dropped
candidates internally — a high drop rate is a healthy sign the filter is working, not a
reason to loosen it. Carry only surviving findings into Step 5.

### Step 5: Report

Every finding MUST cite a concrete diff location and quote the requirement text it relates
to. A finding that cannot point to specific changed line(s) is forbidden — drop it.

For each finding, output exactly these five parts:

- **Construct** — file and **specific changed line(s)** from the diff (e.g. `runner.py:88-104`),
  and what was introduced. Quote the offending lines.
- **Requirement** — the exact text from the Step 1 requirement (ticket/doc/author) this
  finding relates to, quoted verbatim. If the construct serves no stated requirement, quote
  the closest relevant requirement text and state that it does not call for this construct.
- **Couldn't we just…** — the concrete simpler alternative, with a sketch of the simpler
  version.
- **Code removed** — roughly how much code the simpler version deletes.
- **Justification test** — the specific, *present* requirement (from Step 1) that would have
  to be true for the current complexity to be worth keeping. If nothing in this branch
  requires it, say so plainly.

Then a one-line overall verdict.
