# clean-worktrees

A skill that removes the review-board worktrees and branches left behind by sessions that never
ran merge-back.

## The problem

Each review-board button adds a worktree at `.claude/worktrees/review-<id>` on a branch
`review/<id>`. `merge-back` removes it when the work is done. A session that was closed or
crashed first leaves its worktree and branch in place, and they pile up.

## How the skill works

1. **Find** the `review-*` worktrees and the `review/*` branches that no worktree has checked out.
   It skips the worktree it runs in.
2. **Classify** each one as in use (a process is working in it), no base (its upstream is gone),
   unmerged (uncommitted changes or commits not on the base), or done.
3. **Remove** the done ones with `worktree remove` and `branch -d`, which refuse if work would be
   lost.
4. **Ask** about each unmerged or no-base one: keep it for merge-back, or discard it. Only a
   discard uses `--force` and `-D`.
5. **Report** what was removed and what was kept, and why.

## When to use it

When `.claude/worktrees/` holds review worktrees whose sessions are gone.
