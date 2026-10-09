---
name: clean-worktrees
description: >
  Find the review-board worktrees (.claude/worktrees/review-<id>, branch review/<id>) that are
  still lying around, remove the ones whose work is already on their base branch, and report the
  rest. Never discards unmerged work without the user's say-so per worktree. Use when review
  sessions have ended without merge-back, worktrees pile up, or the user asks to clean up review
  worktrees. Triggers on /jacks-skills:clean-worktrees.
---

# Clean Worktrees — Remove Lingering Review Worktrees

Each review-board button adds a worktree at `.claude/worktrees/review-<id>`, on a branch
`review/<id>` that tracks the branch it came from (the base). `jacks-skills:merge-back` removes
the worktree when a session finishes. Sessions that were closed, crashed, or never told to merge
back leave theirs behind. This skill finds them and removes the ones that hold no work.

## Step 1: Find the review worktrees and branches

```sh
git worktree prune                 # drops entries whose directory is already gone
git worktree list --porcelain      # "worktree <path>" + "branch refs/heads/<branch>" per entry
git branch --list 'review/*'
```

A review worktree is an entry whose path ends in `/.claude/worktrees/review-<id>` and whose branch
is `review/<id>`. Leave every other worktree alone. Also note each `review/*` branch that no
worktree has checked out (an orphan branch).

Skip the worktree you are running in (`git rev-parse --show-toplevel`). Git cannot remove it from
inside, and its session is this one. Run every git command below with `-C <main worktree>` (the
first entry of `git worktree list`), so no removal runs from inside the worktree it removes.

If there are no review worktrees and no orphan branches, say so and stop.

## Step 2: Classify each one

For each review worktree, with `<wt>` its path and `<b>` its branch:

```sh
git -C <wt> status --porcelain                                 # uncommitted changes
base=$(git rev-parse --abbrev-ref "<b>@{upstream}")            # the base
git rev-list --count "$base..<b>"                              # commits not on the base
lsof -d cwd -Fn 2>/dev/null | grep -E "^n<wt>(/|$)"            # processes working in it
```

Use `<wt>` exactly as `git worktree list` prints it. It is the resolved path, which is what
`lsof` prints. The `(/|$)` keeps `review-1` from matching `review-12`.

Put it in exactly one group, checking in this order:

1. **In use**: `lsof` printed a line, so a session or shell is still in the worktree.
2. **No base**: the upstream does not resolve (the base branch was deleted or renamed).
3. **Unmerged**: there are uncommitted changes, or the commit count is above `0`.
4. **Done**: clean, and every commit is on the base.

For each orphan branch, run the same `rev-list` check. With `0` commits it is **Done**, otherwise
**Unmerged**; with no upstream it is **No base**.

## Step 3: Remove the Done ones

For each Done worktree, from the main worktree:

```sh
git worktree remove <wt>
git branch -d <b>
```

For each Done orphan branch, run only `git branch -d <b>`.

Use `branch -d`, not `-D`. It refuses if the work is not on the base, which catches anything
Step 2 missed. If a command refuses, move that entry to Unmerged and go on.

## Step 4: Ask about the Unmerged and No base ones

Leave In use worktrees alone. Their session may still be working.

For each Unmerged or No base entry, show the user what would be lost:

```sh
git -C <wt> status --short
git log --oneline "$base..<b>"     # for No base, git log --oneline -5 <b>
```

Then use AskUserQuestion with one question per entry, and these options:

- **Keep (Recommended)**: leave it. To land the work, open a session in the worktree and run
  `/jacks-skills:merge-back`.
- **Discard**: delete the worktree and its branch, and lose the changes listed.

Only for an entry the user chose Discard, run:

```sh
git worktree remove --force <wt>   # skip for an orphan branch
git branch -D <b>
```

## Step 5: Report

Tell the user, in one list per group:

- **Removed**: each worktree or branch you deleted, and whether its work was merged or
  discarded.
- **Kept**: each one left in place, with why (in use, unmerged, no base, the user chose Keep, or
  a command refused) and the path to open to run merge-back.

## Rules

- Touch only `.claude/worktrees/review-*` worktrees and `review/*` branches.
- Never remove the worktree you are running in, or an In use one.
- `--force` and `-D` only for an entry the user chose Discard in Step 4, after seeing what it
  holds. Otherwise, if a safe command refuses, keep the entry and report it.
- Never touch the base branch or any other worktree's changes.
