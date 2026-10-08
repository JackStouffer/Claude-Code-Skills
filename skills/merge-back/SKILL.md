---
name: merge-back
description: >
  Merge the current worktree's branch back into the local branch it was made from, resolve any
  merge conflicts, then remove the worktree and its branch. The branch's upstream must be a local
  branch, as it is for the review sessions that the review board starts. Use when the work in a
  review-board session is done, or the user says to merge the worktree back. Triggers on
  /jacks-skills:merge-back.
---

# Merge Back — Fold a Worktree Into Its Base Branch

The review board starts each session in its own git worktree, on a branch that tracks the local
branch it came from (the base). When the work is done, you put it on the base and remove the
worktree. The base is usually checked out in another worktree that is still in use. So all merge
work, conflicts included, happens here in this worktree. The base only gets a fast-forward, which
cannot conflict.

## Step 1: Check where you are

```sh
git rev-parse --show-toplevel                    # this worktree
git branch --show-current                        # the work branch
git rev-parse --abbrev-ref --symbolic-full-name @{upstream}   # the base
git config "branch.$(git branch --show-current).remote"       # must print "."
```

Stop and tell the user if any of these is true. Do not guess a base.

- No branch is checked out.
- The branch has no upstream, or its remote is not `.`, so the upstream is not a local branch.
- This is the main worktree (the first entry of `git worktree list`), not a linked worktree.

## Step 2: Commit the work

Run `git status`. If there are changes, stage them with `git add -A`, then commit with a message
that says what changed and why. If a pre-commit hook fails, fix the cause and commit again.
Never use `--no-verify`. If the hook needs installed dependencies that this worktree lacks,
install them first (for example, `npm install`).

If the branch has no commits ahead of the base (`git rev-list --count @{upstream}..HEAD` prints
`0`) and nothing to commit, skip to Step 5.

## Step 3: Merge the base into this branch

```sh
git merge --no-edit @{upstream}
```

If the merge reports conflicts, run the `jacks-skills:fix-merge-conflicts` skill with the Skill
tool to resolve them. It edits files only. When it reports done, check that no conflict markers
remain, then stage the resolved files and finish the merge with `git commit --no-edit`. If the
skill flagged a judgment call, show it to the user and get agreement before you commit.

After a merge that changed files, run the project's checks (tests, typecheck, lint) if it has
them. Fix failures before you continue.

## Step 4: Fast-forward the base

Find the worktree that has the base checked out:

```sh
git worktree list --porcelain   # look for "branch refs/heads/<base>"
```

- If a worktree has the base checked out, run
  `git -C <that worktree> merge --ff-only <work branch>`.
- If no worktree has it checked out, run `git fetch . <work branch>:<base>`. This also
  fast-forwards only.

If the fast-forward fails because the base moved (another session merged first), go back to
Step 3. If it fails because of uncommitted changes in the base's worktree, stop. Tell the user
which files are in the way and leave this worktree in place. Do not stash, reset, or check out
anything in the base's worktree. Those are the user's changes.

## Step 5: Remove the worktree and branch

Run these from the base's worktree, or from the main worktree, not from this one:

```sh
git -C <base worktree> worktree remove <this worktree>
git -C <base worktree> branch -d <work branch>
```

Use `branch -d`, not `-D`. It refuses if the work is not on the base. If `worktree remove`
refuses because of untracked or modified files, stop and show them to the user. Do not use
`--force`.

## Step 6: Report

Tell the user:

- The commits that went onto the base, and how you resolved any conflicts.
- The checks you ran and their results.
- That the worktree is gone, so they can close this session.

## Rules

- All merge work happens in this worktree. The base's worktree gets only `merge --ff-only`.
- Never use `--force`, `--no-verify`, `reset --hard`, or `-D`. If a safe command refuses, stop and
  report. Do not override it.
- Never touch uncommitted changes in another worktree.
