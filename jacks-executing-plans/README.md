# jacks-executing-plans

A skill for executing an already-reviewed implementation plan directly, with
progress tracking and per-task verification.

## The problem

`superpowers:executing-plans` runs a critical plan review before execution. Jack
reviews and verifies his plans across several rounds beforehand, so that upfront
step is redundant for him — it re-litigates decisions already settled.

## How the skill works

It keeps the execution benefits — todo tracking, exact step-following, per-task
verification — and drops only the upfront plan review.

1. **Load the plan** and set up task tracking. It probes for whatever tracking
   tool the session exposes (`TaskCreate` family, then `TodoWrite`, then an
   inline checklist) rather than assuming one exists.
2. **Execute each task**: mark in-progress, follow the plan's bite-sized steps
   exactly, run the specified verifications, mark complete.
3. **Complete**: run the plan's final verification / full test pass and report
   results.

Skipping the *plan review* is the only thing dropped — per-task verifications
and the final test pass are not skipped. It stops and asks rather than guessing
when blocked.

## Git is Jack's job

The correct feature branch is set up before this skill runs. It does not create
worktrees, switch or create branches, or make commits — committing, pushing, and
branch integration are left to Jack.
