# plan-splitter

A skill for breaking a large implementation plan into smaller, independently
executable sub-plans, each of which leaves the application in a working, testable
state.

## The problem

Large plans degrade execution accuracy. Once a plan runs past ~8 tasks or ~200
lines of steps, a single session loses focus, drops context, and starts making
mistakes it wouldn't make on a smaller piece. But naively chopping a plan in half
leaves the app broken between the pieces.

## How the skill works

1. **Read and assess.** Read the plan file and measure task count, total
   implementation lines, coupling between tasks, and natural subsystem
   boundaries. If the plan has fewer than 5 tasks and under ~150 lines, it says so
   and stops — the plan is already small enough.
2. **Find runnable break points.** Walk the tasks in order and mark every boundary
   where the app compiles, runs, and can be verified, and the work so far is
   independently valuable. Tightly-coupled tasks (a migration and the code that
   uses it) are grouped so a split never lands mid-feature.
3. **Map dependencies and favor parallelism.** Build the dependency graph between
   candidate sections and look for independent branches that can run at the same
   time. When more than one valid split exists, it picks the one that maximizes
   parallel branches and shortens the critical path — not the one with the fewest
   parts. A split into 4 parts where parts 2 and 3 are independent beats a clean
   3-part sequential split.
4. **Target fewer than 6 splits.** If there are more break points than that,
   adjacent *sequential* sections are merged — preferring sections that share
   files or modules — until there are 3–5 sub-plans. Independent branches are
   never merged away just to lower the count; 6 parts is fine if that preserves
   parallelism.
5. **Generate sub-plan files.** Each part is written as
   `{original-name}-part-{N}.md` alongside the original, with a goal, a
   `Depends on` / `Runs in parallel with` dependency statement, prerequisites,
   starting state, renumbered tasks, and a verification section.
6. **Write concrete verification.** Each part gets specific, runnable, observable
   checks (exact commands with expected output), and later parts re-run earlier
   checks so regressions surface.
7. **Present a summary.** Lists the parts, the files created, and the execution
   order — including which parts can run in parallel — then offers to start.

Each sub-plan points at `superpowers:subagent-driven-development` or
`superpowers:executing-plans` for its own execution.
