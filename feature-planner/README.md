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

1. **Play back the understanding.** Before any questions, restate the idea in
   2-3 sentences so a fundamental misread is caught early.
2. **Structured questioning rounds.** 1-4 questions per round, each round on a
   coherent theme, walking through intent/scope, core behavior, edge cases,
   design tradeoffs, integration, UX, operability, and security — skipping what
   doesn't apply. Later rounds are informed by earlier answers.
3. **Produce the plan.** Once enough is locked down, write a markdown plan:
   overview, goals/non-goals, detailed design, edge cases, the design decisions
   and why each was chosen, implementation notes, and honest open questions.

The questioning is specific (names the actual edge case, not "have you thought
about edge cases?"), offers concrete options with tradeoffs, and challenges
politely. It adapts round count to feature size and stops when the user says to
pick sensible defaults.

## When to use it

Use it in the ambiguity-resolution phase, before coding — "plan a feature",
"spec this out", "help me think through", "write a PRD". Do not use it for tasks
that are already well-specified and just need implementing.
