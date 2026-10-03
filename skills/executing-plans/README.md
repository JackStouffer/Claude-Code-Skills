# executing-plans

A skill for executing an already-reviewed implementation plan directly, with
progress tracking and per-task verification.

## The problem

`superpowers:executing-plans` runs a critical plan review before execution.
`jacks-skills:feature-planner` reviews and verifies his plans across several
rounds beforehand, so that upfront step is redundant.

## How the skill works

It keeps the execution benefits: todo tracking, exact step-following, per-task
verification, and drops only the upfront plan review.

The correct feature branch is set up before this skill runs. It does not create
worktrees, switch or create branches, make commits, or push to remotes.

1. **Load the plan** and set up task tracking. It tracks the plan's tasks with
   the plugin's `update_plan_progress` tool, which draws them on the plan
   progress pane, and falls back to an inline checklist if the tool is missing.
2. **Execute each task**: mark in-progress, follow the plan's bite-sized steps
   exactly, run the specified verifications, mark complete.
3. **Complete**: run the plan's final verification / full test pass and report
   results.

Skipping the *plan review* is the only thing dropped: per-task verifications
and the final test pass are not skipped. It stops and asks rather than guessing
when blocked.
