---
name: executing-plans
description: Execute an already-verified implementation plan with progress
  tracking, skipping the upfront critical plan review. Use when you have a plan
  document that has already been reviewed across several rounds and want to run
  it directly with todo tracking and per-task verifications. Does not manage
  git — branches are set up ahead of time by the user.
---

# Jack's Executing Plans

Jack reviews and verifies his plans across several rounds before execution, so
the upfront critical-review step in `superpowers:executing-plans` is redundant
for him. This skill keeps the execution benefits of that skill — todo tracking,
exact step-following, and per-task verifications — but skips the plan review.

Jack manages git himself. The correct feature branch is already set up before
this skill runs. **Do not** create worktrees, switch or create branches, check
which branch you are on, or make commits — leave all git operations to Jack.

**Announce at start:** "I'm using jacks-skills:executing-plans to implement this
pre-verified plan."

**Do NOT** re-review the plan or raise plan-level concerns before starting.
The plan is already verified. Go straight to execution.

## The Process

### Step 1: Load Plan
1. Read the plan file.
2. Set up task tracking, then proceed. Skip the critical review.

**Task tracking — the plan progress pane.** Track progress with the
`mcp__jacks-skills__update_plan_progress` tool, which draws the plan's steps on
Jack's plan progress pane. If its schema is not loaded, load it first with
`ToolSearch(query: "select:mcp__jacks-skills__update_plan_progress")`.

Every call sends the **full** list of plan tasks, in plan order, each as
`{ subject, status }`: `subject` is the task's name in a few words, `status`
is `pending`, `in_progress` or `completed`. Each call replaces the last list,
so never send a partial list. Now, send every task as `pending`.

If the tool is not available, do NOT error out. Track progress inline: post a
numbered checklist of the plan's tasks in your reply, and restate it with each
task marked done / in-progress as you execute.

### Step 2: Execute Tasks

For each task:
1. Mark the task **in-progress**: call `update_plan_progress` with the full
   list, this task `in_progress`.
2. Follow each step exactly (plan has bite-sized steps).
3. Run verifications as specified.
4. Mark the task **completed** the same way.

### Step 3: Complete

After all tasks complete and verified:
1. Run the plan's final verification / full test pass.
2. Report what was done and the verification results. Leave committing,
   pushing, and branch integration to Jack.

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## Remember
- Skipping *plan review* is the only thing dropped — do NOT skip the per-task
  verifications (Step 2.3) or the final test pass (Step 3).
- Follow plan steps exactly.
- Reference skills when the plan says to.
- Stop when blocked, don't guess.
- Do not touch git — that is Jack's job.
