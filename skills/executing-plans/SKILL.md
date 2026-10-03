---
name: executing-plans
description: Execute an already-verified implementation plan with progress
  tracking, skipping the upfront critical plan review. Use when you have a plan
  document that has already been reviewed across several rounds and want to run
  it directly with todo tracking and per-task verifications. Does not manage
  git — branches are set up ahead of time by the user.
---

This skill executes pre-verified plan files and does

- todo tracking
- exact step-following
- per-task verifications 
- no plan review.

User manages git. The correct feature branch is already set up before
this skill runs. **Do not** create worktrees, switch or create branches, check
which branch you are on, or make commits.

**Do NOT** re-review the plan or raise plan-level concerns before starting.
The plan is already verified. Go straight to execution.

## The Process

### Step 1: Load Plan

1. Read the plan file.
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
numbered checklist of the plan's tasks in your reply, and restate it with each
task marked done / in-progress as you execute.

### Step 2: Execute Tasks

For each task:

1. Mark the task in-progress: call `update_plan_progress` with the full
   list, this task `in_progress`.
2. Follow each step exactly (plan has bite-sized steps).
3. Run verifications as specified.
4. Mark the task completed the same way.

### Step 3: Complete

After all tasks complete and verified:

1. Run the plan's final verification / full test pass.
2. If the repo defines its own definition of done, run every check there.
3. Report what was done and the verification results. Leave committing,
   pushing, and branch integration to the user.

## When to Stop and Ask for Help

**STOP executing immediately when:**

- Hit a blocker (missing dependency, test fails, instruction unclear)
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## Remember

- Follow plan steps exactly.
- Reference skills when the plan says to.
- Stop when blocked, don't guess.
- Do not touch git
