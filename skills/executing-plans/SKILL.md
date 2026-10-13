---
name: executing-plans
description: Execute an implementation plan that is already verified. Track
  progress with a todo list and do the verifications of each task. Do not do a
  critical review of the plan first. Use this skill when a plan document had
  several rounds of review and you want to execute it directly. This skill
  does not manage git. The user creates the branches before the skill starts.
---

The user manages git. The correct feature branch exists before this skill
starts. **Do not** create worktrees. Do not switch branches or create branches.
Do not identify the current branch. Do not make commits.

**Do NOT** review the plan again or raise concerns about the plan before you
start. The plan is already verified. Start the execution immediately. Do not
criticize the design or the approach of the plan. But if you cannot do a step
as written against the actual code, stop. A plan can become stale between
verification and execution.

## The Process

### Step 1: Load the Plan

1. Read the plan file. If the user gave no plan, stop and ask the user for
   direction. Do not search for a plan or write a plan.
2. Start task tracking. Then continue. Do not do the critical review.

Track progress with the `mcp__jacks-skills__update_plan_progress` tool. This
tool shows the steps of the plan on the plan progress pane. If the schema of
the tool is not loaded, load it first with
`ToolSearch(query: "select:mcp__jacks-skills__update_plan_progress")`.

Each call sends the full list of plan tasks, in plan order. Each task is a
`{ subject, status }` object:

- `subject` is the name of the task in a few words.
- `status` is `pending`, `in_progress`, or `completed`.

Each call replaces the previous list. Thus, never send a partial list. Now
send all the tasks as `pending`.

If the tool is not available, do NOT stop with an error. Track progress
inline: post a numbered checklist of the plan tasks in your reply. Post the
checklist again only when the status of a task changes.

### Step 2: Execute Tasks

For each task:

1. Mark the task as in progress. To do this, call `update_plan_progress` with
   the full list, and set this task to `in_progress`.
2. Do each step exactly as written. The plan has small steps. Two deviations
   are permitted. Record each deviation when it occurs. Give the task, what
   the plan said, and what you did:
   - **Trivial mechanical fix**: the intent of the plan is clear, and only one
     correct fix exists. For example: a missing import, a typo in a name, or a
     small syntax error in a snippet. Make the fix.
   - **Step already done**: the code already matches the result of the step.
     Skip the step.

   A change to behavior, an interface, a file path, or the scope is not
   trivial. A choice between options is also not trivial. In these cases,
   stop.
3. Run the verifications that the plan specifies.
4. Mark the task as completed in the same way.

### Step 3: Complete

When all the tasks are complete and verified:

1. Run the final verification of the plan, or the full test pass.
2. If the repo has its own definition of done, run every verification in it.
3. Report. Start with a list of every deviation and every skipped step. For
   each item, give the task and the reason. If there are no items, write "No
   deviations, no skipped steps." This list shows the user where to focus the
   review. Then report what you did and the verification results.
4. Do not commit, push, or integrate branches. The user does these tasks.

## When to Stop and Ask for Help

**Stop the execution immediately when one of these conditions occurs:**

- You have a blocker: a missing dependency, a test failure, or an unclear
  instruction.
- You do not understand an instruction.
- A step does not match the code. For example, a file path does not exist, or
  a function signature changed after the author wrote the plan.
- A verification fails repeatedly.

A trivial mechanical fix (Step 2) is not a reason to stop. This is also true
when the fix makes a test pass that failed before.

**If you are not sure, ask for clarification. Do not guess.**

## Remember

- Do the plan steps exactly. Record every deviation and every skipped step.
- Load and obey each skill that the plan names.
- If you are blocked, stop. Do not guess.
- Do not touch git.
