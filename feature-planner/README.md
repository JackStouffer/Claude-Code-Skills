# feature-planner

A skill for turning a rough feature idea into a complete, buildable plan through
structured questioning before any code is written.

## The problem

The hardest bugs to fix are the ones baked into a bad spec. A rough idea handed
straight to implementation carries unexamined assumptions, unconsidered edge
cases, and tradeoffs nobody chose on purpose — and those surface as rework days
later.

## How the skill works

It acts as a senior staff engineer interrogating the idea one round at a time.

1. **Play back the understanding, then open a notes file.** Before any questions,
   restate the idea in 2-3 sentences so a fundamental misread is caught early, then
   create `plan-notes.md` in the project root as an ephemeral source of truth for
   the spec while planning runs.
2. **Structured questioning rounds.** 1-4 questions per round, each round on a
   coherent theme, walking through intent/scope, core behavior, edge cases,
   design tradeoffs, integration, UX, operability, and security — skipping what
   doesn't apply. After every round the locked decisions are appended to
   `plan-notes.md`, so the spec lives on disk, not in the chat.
3. **Consolidate & confirm.** When questioning ends, the whole spec is restated in
   one consolidated message and the user must explicitly confirm it before anything
   is generated.
4. **Produce the plan in a fresh context.** A subagent reads only `plan-notes.md`
   and writes the markdown plan — overview, goals/non-goals, detailed design, edge
   cases, the design decisions and why each was chosen, implementation notes, and
   honest open questions, saving it to the project root. The interview transcript
   never reaches the generating context, which is what keeps the plan from
   degrading. Once the plan is written, `plan-notes.md` is deleted — it was scratch.

The questioning is specific (names the actual edge case, not "have you thought
about edge cases?"), offers concrete options with tradeoffs, and challenges
politely. It adapts round count to feature size and stops when the user says to
pick sensible defaults.

## When to use it

Use it in the ambiguity-resolution phase, before coding — "plan a feature",
"spec this out", "help me think through", "write a PRD". Do not use it for tasks
that are already well-specified and just need implementing.
