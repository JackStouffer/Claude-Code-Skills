---
name: feature-planner
description: >
  Deep-dive feature planning through structured questioning. Use this skill whenever the user
  wants to plan a feature, design a system, spec out functionality, or think through a new
  capability before building it. Triggers on phrases like "plan a feature", "help me think
  through", "spec out", "design this feature", "I want to build X — help me plan it",
  "let's figure out the requirements", "what should I consider for", or any request where
  the user gives a broad/rough idea and wants Claude to interrogate it into a complete,
  buildable plan. Also use when the user says "feature plan", "requirements gathering",
  "design doc", or "PRD". Do NOT use for tasks that are already well-specified and just
  need implementation — this skill is for the ambiguity-resolution phase that comes before coding.
---

# Feature Planner

The user has a rough idea for a feature and your job is to ask incisive questions, one round at a time, until you have a complete, unambiguous understanding of what they want. Only then do you produce the final plan. User is techical; use precise terminology, discuss implementation details, ask about specific algorithms or data structures.

## Why this matters

The hardest bugs to fix are the ones baked into a bad spec. A feature that's been thoroughly interrogated before a single line of code is written saves days of rework. Your questioning should surface the assumptions the user hasn't examined yet, the edge cases they haven't considered, and the tradeoffs they haven't explicitly chosen.

## Workflow

### Phase 1: Receive the seed idea

The user gives you a rough description of what they want. Read it carefully. Identify:

- What's explicitly stated
- What's implied but not stated
- What's completely missing

Do NOT start asking questions yet. First, play back your understanding in 2-3 sentences so the user can correct any fundamental misunderstanding before you dive into details.

Once the user confirms your played-back understanding, create a running notes file at `plan-notes.md` in the project root and **tell the user the exact path**. This file is an ephemeral scratch pad — not the chat history — that holds the source of truth for the spec while planning is underway, and it must survive across context resets. It gets deleted in Phase 4 once the final plan is written. Seed it:

```markdown
# Plan Notes: [Feature Name]

## Seed idea
[The user's original description, plus the understanding you played back and they confirmed.]
```

### Phase 2: Structured questioning rounds

Ask questions using the `AskUserQuestion` tool (or equivalent interactive questioning mechanism in your environment). Ask questions **one round at a time**, with 1-4 questions per round. Each round should focus on a coherent theme.

Work through these dimensions in roughly this order, skipping any that are obviously not applicable. You don't need to cover every single one — use judgment about what matters for this particular feature.

**Round 1 — Intent & scope**
Why does this feature exist? What user problem does it solve? Who is the target user? What does success look like? What is explicitly OUT of scope?

**Round 2 — Core behavior**
Walk through the happy path step by step. What does the user see/do at each stage? What are the inputs and outputs? What's the data model look like at a high level?

**Round 3 — Edge cases & error handling**
What happens when things go wrong? Invalid input, partial failures, timeouts, concurrent access, empty states, rate limits. What are the boundary conditions? What happens at scale?

**Round 4 — Design tradeoffs**
Where are the tension points? Speed vs. correctness, simplicity vs. flexibility, consistency vs. availability. Present the tradeoffs you've identified and ask the user to make explicit choices rather than assuming.

**Round 5 — Integration & dependencies**
How does this interact with existing systems? What APIs, services, or data stores does it touch? Are there ordering dependencies, migration concerns, or backward compatibility requirements?

**Round 6 — UX & presentation** (if applicable)
How should this look and feel? What feedback does the user get? Loading states, confirmation flows, undo capability, accessibility considerations.

**Round 7 — Operability**
How do we know it's working? Logging, monitoring, alerting. How is it configured? Feature flags? Rollback plan?

**Round 8 — Security & privacy** (if applicable)
Authentication, authorization, data sensitivity, PII handling, audit trails.

### Questioning style

- **Be specific, not generic.** Don't ask "have you thought about edge cases?" — name the actual edge case you see: "What happens if a user submits this form twice within 500ms?"
- **Offer options when you can.** Instead of open-ended "how should we handle X?", present 2-3 concrete approaches with tradeoffs: "We could (a) queue and deduplicate, which is safest but adds latency, or (b) accept-last-write-wins, which is simpler but risks data loss. Which fits better?"
- **Challenge politely.** If something in the user's description seems like it might cause problems, say so: "You mentioned doing X synchronously — at the scale you described, that could become a bottleneck. Want to consider an async approach, or is synchronous simplicity more important here?"
- **Know when to stop.** If the user's answers are getting terse or they say "that's fine, just pick something reasonable", respect that. Not every decision needs to be interrogated. Use your judgment to fill in sensible defaults and note them in the plan.
- **Record every round to disk.** After each round's answers, append the decisions locked in that round to `plan-notes.md` — the concrete choices, not a chat summary. One section per round:

  ```markdown
  ## Round N — [theme]
  - [Decision]: [what was chosen, plus the why if a tradeoff was made]
  - [Deferred]: [anything the user punted on, logged as an open question]
  ```

  Record what was *decided*, not what was *discussed*. This file must be complete enough that someone who never saw the conversation could rebuild the spec from it — because in Phase 4 that is exactly what happens.
- **Synthesize as you go.** At the start of each new round, summarize from `plan-notes.md` what's locked down so far so the user can see progress and correct course early.

### Phase 3: Consolidate & confirm

When questioning is done (the user signals they're satisfied, or you've covered the dimensions that matter), do NOT go straight to the plan. First, read `plan-notes.md` back and emit **one consolidated restatement of the entire spec** in a single message — every goal, non-goal, behavior, edge-case decision, tradeoff chosen, and open question, gathered in one place.

Then ask for explicit confirmation: "Does this capture everything correctly? Anything to add, change, or remove before I generate the plan?"

- If the user requests changes, update `plan-notes.md`, re-emit the full consolidated restatement, and ask again. Loop until they confirm.
- Only proceed once the user explicitly confirms.

On confirmation, write the final consolidated spec into `plan-notes.md` under a `## Consolidated spec (confirmed)` section. This is the single, self-contained input for the next phase.

### Phase 4: Produce the plan in a fresh context

Dispatch a subagent (e.g. the Task tool) with an instruction like:

> Read `plan-notes.md` at `<exact path>`. It is a complete, confirmed feature spec. Using **only** that file as input, produce a feature plan in the structure below and save it as a markdown file in the project root. Do not ask questions — the spec is final.
>
> [paste the Plan structure block below verbatim]

#### Plan structure

```
# Feature Plan: [Feature Name]

## Overview
2-3 sentence summary of what this feature does and why.

## Goals & Non-Goals
### Goals
- Bulleted list of what this feature WILL do
### Non-Goals
- Bulleted list of what this feature explicitly WILL NOT do (and why)

## Detailed Design

### User Flow
Step-by-step walkthrough of the happy path. Number each step.

### Data Model
Describe entities, relationships, and key fields. Use a simple schema
notation or table — not a full DDL, just enough to communicate structure.

### API / Interface
If applicable, describe the key interfaces. Method signatures, endpoint
shapes, CLI flags — whatever is relevant.

### Edge Cases & Error Handling
A table or list of edge cases and how each is handled. Reference the
decisions made during questioning.

### Design Decisions
Document each significant tradeoff that was discussed, what was chosen,
and why. This is the most valuable part of the plan — future you will
thank present you.

## Implementation Notes
Suggested order of implementation, key risks, and anything the
implementer should watch out for.

## Open Questions
Anything that still needs resolution. Be honest — it's better to flag
unknowns than to pretend everything is settled.
```

The subagent saves this plan as a markdown file in the project root so the user can reference it during implementation. Once the plan file is written, delete `plan-notes.md` right away. It was ephemeral scratch, and the plan supersedes it.

### Phase 5: Correctness check

Before reporting the plan as done, dispatch a subagent to verify every concrete claim the plan makes about the *current* state of the source code. Only check claims about code that already exists. Ignore descriptions of code the plan proposes to *add* — those are not verifiable yet.

Dispatch it with an instruction like:

> Read the feature plan at `<exact plan path>`. It describes a feature to build in this codebase. Check every concrete claim it makes about the code that **already exists** — file paths, line numbers, function/class/type names, imports, signatures, config keys. For each claim, verify it against the actual source. Do NOT check claims about code the plan proposes to add. Report any claim that is wrong (file missing, line mismatch, name misspelled or nonexistent, etc.) as a bullet-point list, each bullet naming the claim and what's actually true. If every claim checks out, report exactly `No issues found.`

If the subagent found issues fix them right away. Otherwise report the plan is completed to the user with the plan path.

## Adapting to context

- **Small features**: You might only need 2-3 rounds. Don't over-interrogate a simple config flag.
- **Large systems**: You might need 8+ rounds and the plan might be several pages. That's fine.

## Anti-patterns to avoid

- Don't ask questions you can answer yourself from context. If the user said "this is for our React app", don't ask "what framework are you using?"
- Don't repeat questions the user already answered in their initial description.
- Don't front-load all questions in one massive wall of text. The point of rounds is to let earlier answers inform later questions.
- Don't produce the plan prematurely. If you still have significant unknowns, ask another round.
- Don't be a passive scribe. You're a design partner — push back, suggest alternatives, flag risks.
