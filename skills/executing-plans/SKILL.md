---
name: executing-plans
description: Execute an already-verified implementation plan with progress
  tracking, skipping the upfront critical plan review. Use when you have a plan
  document that has already been reviewed across several rounds and want to run
  it directly with todo tracking and per-task verifications. Does not manage
  git — branches are set up ahead of time by the user.
---

User manages git. The correct feature branch is already set up before
this skill runs. **Do not** create worktrees, switch or create branches, check
which branch you are on, or make commits.

**Do NOT** re-review the plan or raise plan-level concerns before starting.
The plan is already verified. Go straight to execution. Don't critique the
plan's design or approach, but do stop when a step can't be carried out as
written against the actual code. Plans can go stale between verification and
execution.

## The Process

### Step 1: Load Plan

1. Read the plan file. If no plan was given, stop and ask the user for
   direction. Do not search for a plan or write one.
2. Set up task tracking, then proceed. Skip the critical review.

Track progress with the `mcp__jacks-skills__update_plan_progress` tool, which
draws the plan's steps on the plan progress pane. If its schema is not loaded,
load it first with
`ToolSearch(query: "select:mcp__jacks-skills__update_plan_progress")`.

Every call sends the full list of plan tasks, in plan order, each as
`{ subject, status }`: `subject` is the task's name in a few words, `status`
is `pending`, `in_progress` or `completed`. Each call replaces the last list,
so never send a partial list. Now, send every task as `pending`.

If the tool is not available, do NOT error out. Track progress inline: post a
numbered checklist of the plan's tasks in your reply. Restate it only when a
task's status changes.

### Step 2: Execute Tasks

For each task:

1. Mark the task in-progress: call `update_plan_progress` with the full
   list, this task `in_progress`.
2. Follow each step exactly (plan has bite-sized steps). Two deviations are
   allowed, and you must record each one as it happens (task, what the plan
   said, what you did):
   - **Trivial mechanical fix**: the plan's intent is unambiguous and only one
     correct fix exists, e.g. a missing import, a typo in a name, a small
     syntax slip in a snippet. Make the fix.
   - **Step already done**: the code already matches what the step would
     produce. Skip it.

   Anything that changes behavior, an interface, a file path or the scope, or
   that needs you to choose between options, is not trivial. Stop.
3. Run verifications as specified.
4. Mark the task completed the same way.

### Step 3: Complete

After all tasks complete and verified:

1. Run the plan's final verification / full test pass.
2. If the repo defines its own definition of done, run every check there.
3. Report, starting with every deviation and every skipped step, each with
   its task and reason, or "No deviations, no skipped steps." This list shows
   the user where to focus review. Then report what was done and the
   verification results. Leave committing, pushing, and branch integration to
   the user.

## When to Stop and Ask for Help

**STOP executing immediately when:**

- Hit a blocker (missing dependency, test fails, instruction unclear)
- You don't understand an instruction
- A step doesn't match the code (a file path that doesn't exist, a function
  signature that has changed since the plan was written)
- Verification fails repeatedly

A trivial mechanical fix (Step 2) is not a stop, even when it is what makes a
failing test pass.

**Ask for clarification rather than guessing.**

## Remember

- Follow plan steps exactly; record every deviation and skip.
- Load and follow any skill the plan names.
- Stop when blocked, don't guess.
- Do not touch git
