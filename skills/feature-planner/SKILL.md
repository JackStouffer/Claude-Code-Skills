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

The user has a rough idea for a feature and your job is to ask incisive questions, one domain at a time, until you have a complete, unambiguous understanding of what they want. Only then do you produce the final plan. The user is technical; use precise terminology, discuss implementation details, ask about specific algorithms or data structures.

## Why this matters

Bugs baked into a bad spec are the hardest to fix. Interrogating a feature before it's built saves rework later. Your questions should surface the assumptions the user hasn't examined, the edge cases they've missed, and the tradeoffs they haven't explicitly chosen.

## Workflow

**Waiting on dispatched subagents.** Whenever a phase dispatches a background subagent (Phases 2, 4, and 5), wait for it with `TaskOutput(task_id, block=true, timeout=300000)` — a five-minute block — not a `sleep`. Re-block if it's still running when the timeout returns.

### Phase 1: Receive the seed idea

The user gives you a rough description of what they want. Read it carefully. Identify:

- What's explicitly stated
- What's implied but not stated
- What's completely missing

Do NOT start asking questions yet. First, play back your understanding in 2-3 sentences so the user can correct any fundamental misunderstanding before you get into the details.

Once the user confirms your played-back understanding, create a running notes file at `plan-notes.md` in the project root and **tell the user the exact path**. This file is an ephemeral scratch pad, not the chat history, that holds the source of truth for the spec while planning is underway, and it must survive across context resets. It gets deleted in Phase 4 once the final plan is written. Seed it:

```markdown
# Plan Notes: [Feature Name]

## Seed idea
[The user's original description, plus the understanding you played back and they confirmed.]
```

### Phase 1b: Gather background

The question generator in Phase 2 cannot read files. It knows only what `plan-notes.md` says, so collect the background it needs now. Explore the codebase (dispatch an Explore subagent for anything broad) and append a `## Background` section to `plan-notes.md` covering:

- Existing code the feature touches: modules, entry points, data models, with file paths
- Current behavior the feature must preserve or change, including validation and constraints already enforced
- Adjacent systems it would interact with: APIs, services, data stores, jobs, feature flags
- Conventions already in force: auth model, error-handling patterns, test setup
- Anything in the seed idea you had to look up to understand

Record only what you verified in the source, with file paths. Where you looked and found nothing, write "unknown" rather than a guess. A wrong fact here becomes a question built on a false premise, which misleads the user more than a missing question would.

### Phase 2: Generate and ask questions

**Generate.** Create an output dir (`mktemp -d`). Dispatch the `jacks-skills:fp-question-gen` agent (Opus, medium effort, Write tool only) — it ships with this plugin. It cannot read files, so build its prompt from `question-gen-prompt.md` in this skill's folder: paste the full contents of `plan-notes.md` where the file indicates and fill in the output dir. The file also lists the question domains, in the order to ask them. The agent writes one JSON file per domain and replies with the paths.

If `jacks-skills:fp-question-gen` is not an available agent type, stop and tell the user that the `jacks-skills` plugin (which bundles this agent) is not fully installed or enabled, and to reinstall/enable it and restart the session.

**Ask.** Read each domain's JSON file. Go through the domains in the order listed in `question-gen-prompt.md` and ask each domain's questions with the `AskUserQuestion` tool (or the equivalent in your environment), up to 4 questions per call, mapping `header`, `question`, and `options` straight through. Ask every generated question; the generator already trimmed to what the plan needs. Skip a domain whose array is empty.

- **Follow up when an answer opens new ground.** If an answer creates a decision no generated question covers, ask it before leaving that domain. Be specific, offer 2-3 options with tradeoffs, and challenge politely when an answer looks like it will cause problems at the stated scale.
- **Know when to stop.** If the user's answers are getting terse or they say "that's fine, just pick something reasonable", respect that. Fill in sensible defaults and note them as decisions.
- **Record every domain to disk.** After each domain's answers, append the decisions to `plan-notes.md`: the concrete choices, not a chat summary.

```markdown
## [Domain]
- [Decision]: [what was chosen, plus the why if a tradeoff was made]
- [Deferred]: [anything the user punted on, logged as an open question]
```

Record what was *decided*, not what was *discussed*. This file must be complete enough that someone who never saw the conversation could rebuild the spec from it, because in Phase 4 that is exactly what happens.

- **Synthesize as you go.** At the start of each new domain, summarize from `plan-notes.md` what's locked down so far so the user can see progress and correct course early.

### Phase 3: Consolidate & confirm

When questioning is done (the user signals they're satisfied, or you've covered the dimensions that matter), do NOT go straight to the plan. First, read `plan-notes.md` back and emit **one consolidated restatement of the entire spec** in a single message: every goal, non-goal, behavior, edge-case decision, tradeoff chosen, and open question, gathered in one place.

This consolidated restatement is a chat message only, for the user to confirm. Do NOT write it to `plan-notes.md` — the notes already hold these decisions domain by domain, and duplicating them there just creates a second, drifting copy. Only the user's changes and corrections get written back.

Then ask for explicit confirmation: "Does this capture everything correctly? Anything to add, change, or remove before I generate the plan?"

- If the user requests changes, write the changes and corrections into `plan-notes.md`, then ask again. Loop until they confirm.
- Only proceed once the user explicitly confirms.

On confirmation, continue.

### Phase 4: Produce the plan in a fresh context

Dispatch the `jacks-skills:fp-plan-writer` agent. Build its prompt inline: paste the full contents of `plan-notes.md` and the full contents of `plan-structure.md` (from this skill's folder), and give it the exact output path in the project root. Instruct it like:

> Below is a complete, confirmed feature spec, followed by the plan structure to follow. Using **only** what is in this prompt, transform the spec into a feature plan and write it to `<exact output path>`. Follow the plan structure exactly. Do not ask questions and do not verify anything; the spec is final. Reply with only the path.
>
> --- SPEC (plan-notes.md) ---
> `<full contents of plan-notes.md>`
>
> --- PLAN STRUCTURE (plan-structure.md) ---
> `<full contents of plan-structure.md>`

Once the agent writes the plan file, delete `plan-notes.md` right away. It was ephemeral scratch, and the plan supersedes it.

### Phase 5: Correctness check

Before reporting the plan as done, dispatch a subagent to verify every concrete claim the plan makes about the *current* state of the source code. Only check claims about code that already exists. Ignore descriptions of code the plan proposes to *add*; those are not verifiable yet.

Dispatch it with an instruction like:

> Read the feature plan at `<exact plan path>`. It describes a feature to build in this codebase. Check every concrete claim it makes about the code that **already exists** — file paths, line numbers, function/class/type names, imports, signatures, config keys. For each claim, verify it against the actual source. Do NOT check claims about code the plan proposes to add. Report any claim that is wrong (file missing, line mismatch, name misspelled or nonexistent, etc.) as a bullet-point list, each bullet naming the claim and what's actually true. If every claim checks out, report exactly `No issues found.`

If the subagent found issues, fix them right away. Otherwise report the plan is completed to the user with the plan path.

## Adapting to context

- **Small features**: Several domains will come back empty. Don't over-interrogate a simple config flag.
- **Large systems**: Every domain may fill its six slots and the plan might be several pages. That's fine.

## Anti-patterns to avoid

- Don't skip Phase 1b. Every fact the generator lacks is a question it cannot ask or, worse, one it asks on a false premise.
- Don't paraphrase or trim `plan-notes.md` in the generator prompt. Paste it whole.
- Don't ask the user something the background already answers. If a generated question is settled by the notes, answer it from the notes and record the decision.
- Don't produce the plan prematurely. If you still have significant unknowns, ask about them.
- Don't be a passive scribe. You're a design partner: push back, suggest alternatives, and flag risks.
