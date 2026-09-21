# feature-planner

A skill for turning a rough feature idea into a complete, buildable plan through
structured questioning before any code is written.

## The problem

The hardest bugs to fix are the ones baked into a bad spec. A rough idea handed
straight to implementation carries unexamined assumptions, unconsidered edge
cases, and tradeoffs nobody chose on purpose, and those surface as rework days
later.

## How the skill works

It acts as a senior staff engineer interrogating the idea one round at a time.

1. **Play back the understanding, then open a notes file.** Before any questions,
   restate the idea in 2-3 sentences so a fundamental misread is caught early, then
   create `plan-notes.md` in the project root as an ephemeral source of truth for
   the spec while planning runs.
2. **Gather background.** Explore the codebase for the code the feature touches,
   the behavior it must preserve, adjacent systems, and conventions in force, and
   write the verified facts (with file paths) into `plan-notes.md`. The question
   generator in the next step cannot read files, so this is all it will know.
3. **Generate and ask questions.** A Write-only Opus subagent (`fp-question-gen`,
   installed from `agents/`) receives the plan notes plus a description of eight
   question domains (intent/scope, core behavior, edge cases, design tradeoffs,
   integration, UX, operability, security) via `question-gen-prompt.md`, and
   writes up to six open questions per domain as JSON, fewer when the domain has
   little open ground. The main agent asks every generated question with
   `AskUserQuestion`, follows up where an answer opens new ground, and appends
   each domain's decisions to `plan-notes.md`, so the spec lives on disk, not in
   the chat.
4. **Consolidate & confirm.** When questioning ends, the whole spec is restated in
   one consolidated message and the user must explicitly confirm it before anything
   is generated.
5. **Produce the plan in a fresh context.** A subagent reads only `plan-notes.md`
   and writes the markdown plan: overview, goals/non-goals, detailed design, edge
   cases, the design decisions and why each was chosen, implementation notes, and
   honest open questions, saving it to the project root. The interview transcript
   never reaches the generating context, which keeps the plan from degrading. Once
   the plan is written, `plan-notes.md` is deleted; it was scratch.
6. **Correctness check.** A Sonnet subagent verifies every concrete claim the plan
   makes about the existing codebase — file paths, line numbers, function and type
   names — against the actual source, and reports any mismatch as a bullet list (or
   `No issues found.`). It catches hallucinated code references before they reach
   implementation.

The questioning is specific (names the actual edge case, not "have you thought
about edge cases?"), offers concrete options with tradeoffs, and challenges
politely. Question count adapts to feature size, since the generator leaves a
domain empty when nothing is open, and the main agent stops when the user says
to pick sensible defaults.
