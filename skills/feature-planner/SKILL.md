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

The user has a rough idea for a feature. Your task is to ask incisive questions, one domain at a time, until you understand exactly what the user wants. 

A bug baked into a bad spec is the hardest bug to fix. Questions asked before you build a feature save rework later. Your questions must surface:

- the assumptions the user did not examine
- the edge cases the user missed
- the tradeoffs the user did not choose on purpose

The user is technical: use precise terms, discuss implementation details, ask about specific algorithms or data structures.

### Phase 1: Receive the seed idea

The user gives you a rough description. Read it carefully. Identify three things:

- what the description states
- what the description implies but does not state
- what the description does not include

Do not ask questions yet. First, restate your understanding in 2-3 sentences. The user can then correct a fundamental misunderstanding before you go into the details.

After the user confirms your restatement, create a running notes file at `plan-notes.md` in the project root. **Tell the user the exact path.** This file is an ephemeral scratch pad, not the chat history. It holds the source of truth for the spec during planning. It must survive across context resets. Phase 6 deletes it after the final plan is written. Seed it:

```markdown
# Plan Notes: [Feature Name]

## Seed idea
[The user's original description, plus the understanding you played back and they confirmed.]
```

### Phase 2: Gather background

Collect the background info into `plan-notes.md`. Explore the codebase to gather context. For anything broad, dispatch an Explore subagent. 

Append a `## Background` section with two subsections to `plan-notes.md`:

- Current state
  - Existing code the feature touches: modules, entry points, data models, with file paths
  - Current behavior the feature must preserve or change, with the validation and constraints already enforced
  - Adjacent systems the feature can interact with: APIs, services, data stores, jobs, feature flags
  - Conventions already in force: auth model, error-handling patterns, test setup
  - Anything in the seed idea that you looked up to understand it
- Claims from prior docs and people
  - Claims can be contradictory with other information. Mark them as such

Each piece of background information ends with one tag to identify its source:

- `[code path:line]`
- `[pkg name==version path]`
- `[doc file: current | planned | stale]`
- `[person name, date]`
- `[unverified]`

If you looked and found nothing, write "unknown" instead of a guess.

### Phase 3: Generate and ask questions

**Generate.** Create an output dir with `mktemp -d`. Dispatch the `jacks-skills:fp-question-gen` agent. It cannot read files. Build its prompt from `question-gen-prompt.md` in this skill's folder. Paste the full contents of `plan-notes.md` where the file indicates. Add the output dir. The file also lists the question domains, in the order to ask them. The agent writes one JSON file per domain and replies with the paths.

If `jacks-skills:fp-question-gen` is not an available agent type, stop. Tell the user that the `jacks-skills` plugin is not fully installed or enabled. This plugin bundles the agent. Tell the user to reinstall or enable the plugin and restart the session.

**Ask.** Read each domain's JSON file from the agent. Process the domains in the order listed in `question-gen-prompt.md`. Ask each domain's questions with the `AskUserQuestion` tool, or the equivalent in your environment. Ask up to 4 questions per call. Map `header`, `question`, and `options` directly through. Ask every generated question. The generator already trimmed the questions to what the plan needs. If a domain's array is empty, skip that domain.

- **Ask a follow-up question when an answer opens new ground.** If an answer creates a decision that no generated question covers, ask about it before you leave that domain. Be specific. Offer 2-3 options with tradeoffs. If an answer looks like it will cause problems at the stated scale, challenge it politely.
- **Ask a clarification questions on contradictory information from Phase 2.**
- **Record every domain to disk.** After each domain's answers, append the decisions to `plan-notes.md`. Record the concrete choices, not a chat summary.

```markdown
## [Domain]
- [Decision]: [what was chosen, plus the why if a tradeoff was made]
- [Deferred]: [anything the user punted on, logged as an open question]
```

Record what was *decided*, not what was *discussed*. This file must be complete enough that a person who never saw the conversation can rebuild the spec from it.

### Phase 4: Consolidate & confirm

Once finished with asking questions read `plan-notes.md` again. Emit **one consolidated restatement of the entire spec** in a single message. Gather every goal, non-goal, behavior, edge-case decision, tradeoff chosen, and open question in one place. This consolidated restatement is a chat message only, for the user to confirm. Do not write it to `plan-notes.md`.

Then ask for explicit confirmation: "Does this capture everything correctly? Anything to add, change, or remove before I generate the plan?"

- If the user requests changes, write the changes and corrections into `plan-notes.md`. Then ask again. Repeat until the user confirms.
- Proceed only after the user confirms explicitly.

After the user confirms, continue.

### Phase 5: Produce the plan in a fresh context

Dispatch the `jacks-skills:fp-plan-writer` agent. Build its prompt inline. Paste the full contents of `plan-notes.md` and the full contents of `plan-structure.md` from this skill's folder. Give the agent the exact output path in the project root. Instruct it like this:

> Below is a complete, confirmed feature spec, followed by the plan structure to follow. Using **only** what is in this prompt, transform the spec into a feature plan and write it to `<exact output path>`. Follow the plan structure exactly. Do not ask questions and do not verify anything; the spec is final. Reply with only the path.
>
> --- SPEC (plan-notes.md) ---
> `<full contents of plan-notes.md>`
>
> --- PLAN STRUCTURE (plan-structure.md) ---
> `<full contents of plan-structure.md>`

### Phase 6: Correctness check

Before you report the plan as done, dispatch a subagent. The subagent checks two things

1. Every concrete claim the plan makes about the *current* state of the source code to make
   sure they're accurate.
2. That all of the decisions, background context, relevant files, risks, conflicts, etc from
   the `plan-notes.md` file are faithfully reproduced in the new plan file.

Dispatch it with instructions to report every issue in a bullet point list. If there are no
issues then have it report `No issues found`.

If the subagent found issues, fix them immediately. If not, report the completed plan to the user with the plan path.

After the correctness checks and edits are finished delete `plan-notes.md` immediately. It was ephemeral scratch. The plan supersedes it.

## Adapting to context

- **Small features**: Several domains return empty. Do not over-interrogate a simple config flag.
- **Large systems**: Every domain can fill its six slots, and the plan can be several pages. This is acceptable.

## Anti-patterns to avoid

- Do not skip Phase 2. Every fact the generator lacks is a question it cannot ask, or worse, a question it asks on a false premise.
- Do not paraphrase or trim `plan-notes.md` in the generator prompt. Paste it whole.
- Do not ask the user something the background already answers. If the notes settle a generated question, answer it from the notes and record the decision.
- Do not produce the plan too early. If you still have significant unknowns, ask about them.
- Do not be a passive scribe. You are a design partner. Challenge the user, suggest alternatives, and flag risks.
