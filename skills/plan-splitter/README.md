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
3. **Target fewer than 6 splits.** If there are more break points than that,
   adjacent small sections are merged — preferring sections that share files or
   modules — until there are 3–5 sub-plans.
4. **Generate sub-plan files.** Each part is written as
   `{original-name}-part-{N}.md` alongside the original, with a goal,
   prerequisites, starting state, renumbered tasks, and a verification section.
5. **Write concrete verification.** Each part gets specific, runnable, observable
   checks (exact commands with expected output), and later parts re-run earlier
   checks so regressions surface.
6. **Present a summary.** Lists the parts, the files created, and the execution
   order, then offers to start Part 1.

Each sub-plan points at `superpowers:subagent-driven-development` or
`superpowers:executing-plans` for its own execution.
