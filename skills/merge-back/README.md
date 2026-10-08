# merge-back

A skill that merges a review-board worktree's branch back into the local branch it came from,
then removes the worktree.

## The problem

The review board starts each session in its own worktree, so parallel sessions do not edit the
same checkout. When a session is done, its work must get back onto the original branch. That
branch is usually checked out in a worktree that is still in use, so a merge there could leave
conflicts in the middle of other work.

## How the skill works

1. **Check** that the branch tracks a local branch (the base) and that this is a linked worktree.
2. **Commit** the session's work, with the pre-commit hooks.
3. **Merge the base into this branch**, here in the worktree. Conflicts go to
   `fix-merge-conflicts`, then the project's checks run.
4. **Fast-forward the base** to this branch. A fast-forward cannot conflict. If the base moved,
   go back to step 3. If uncommitted changes are in the way, stop.
5. **Remove** the worktree and the branch, without `--force`.
6. **Report** the commits, the conflict resolutions, and the checks.

## When to use it

When the work in a review-board session is done.
