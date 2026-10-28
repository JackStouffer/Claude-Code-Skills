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
`0`) and nothing to commit, skip to Step 6. (The merge lock is not needed: Steps 5–6 do not
touch the base.)

## Step 3: Take the merge lock

Steps 4–5 touch the shared base, so only one session may run them at a time. Take a repo-wide
lock before merging and hold it until the fast-forward is done:

```sh
lock="$(git rev-parse --path-format=absolute --git-common-dir)/merge-back.lock"
echo "lock path: $lock"
SECONDS=0
until mkdir "$lock" 2>/dev/null; do   # atomic; waits until another session frees it
  [ "$SECONDS" -ge 600 ] && { echo "merge lock still held after 10 minutes: $lock"; exit 1; }
  sleep 2
done
echo "lock taken: $lock"
```

Run this with `run_in_background: true`, so the Bash tool's timeout does not stop the wait.

The `$lock` variable does not carry over to later Bash calls. Note the absolute path that the
command printed (it starts with `/`). Every later step that says `rmdir <lock path>` means that
exact absolute path, written out in full. Never use a relative path such as `.git/merge-back.lock`,
and never rebuild the path yourself: a relative path resolves against the current directory, so it
misses the real lock, or the wrong lock gets taken.

If it gives up after 10 minutes, another session holds the lock, or a session died while it held
the lock. Stop. Tell the user the absolute lock path and that the lock is held. Say that if no
other merge-back is running, `rmdir <lock path>` clears it. Do not remove the lock yourself, and
do not continue. Wait for the user's instructions.

## Step 4: Merge the base into this branch

```sh
git merge --no-edit @{upstream}
```

If the merge reports conflicts, run the `jacks-skills:fix-merge-conflicts` skill with the Skill
tool to resolve them. It edits files only. When it reports done, check that no conflict markers
remain, then stage the resolved files and finish the merge with `git commit --no-edit`. If the
skill flagged a judgment call, show it to the user and get agreement before you commit.

After a merge that changed files, run the project's checks (tests, typecheck, lint) if it has
them. Fix failures before you continue.

## Step 5: Fast-forward the base

Find the worktree that has the base checked out:

```sh
git worktree list --porcelain   # look for "branch refs/heads/<base>"
```

- If a worktree has the base checked out, run
  `git -C <that worktree> merge --ff-only <work branch>`.
- If no worktree has it checked out, run `git fetch . <work branch>:<base>`. This also
  fast-forwards only.

If the fast-forward fails because the base moved (another session merged first — rare while the
lock is held), go back to Step 4 without re-taking the lock; you still hold it. If it fails
because of uncommitted changes in the base's worktree, stop (release the lock with
`rmdir <lock path>` first). Tell the user which files are in the way and leave this worktree in
place. Do not stash, reset, or check out anything in the base's worktree. Those are the user's
changes.

Once the fast-forward succeeds, release the lock:

```sh
rmdir <lock path>   # the absolute path that Step 3 printed
```

## Step 6: Remove the worktree and branch

Run these from the base's worktree, or from the main worktree, not from this one:

```sh
git -C <base worktree> worktree remove <this worktree>
git -C <base worktree> branch -d <work branch>
```

Use `branch -d`, not `-D`. It refuses if the work is not on the base. If `worktree remove`
refuses because of untracked or modified files, stop and show them to the user. Do not use
`--force`.

## Step 7: Report

Tell the user:

- The commits that went onto the base, and how you resolved any conflicts.
- The checks you ran and their results.
- That the worktree is gone, so they can close this session.

## Rules

- All merge work happens in this worktree. The base's worktree gets only `merge --ff-only`.
- Never use `--force`, `--no-verify`, `reset --hard`, or `-D`. If a safe command refuses, stop and
  report. Do not override it.
- Never touch uncommitted changes in another worktree.
- If you stop to report a problem while holding the merge lock (Steps 4–5), release it first with
  `rmdir <lock path>` so other sessions are not blocked.
