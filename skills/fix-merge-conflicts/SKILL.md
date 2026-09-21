---
name: fix-merge-conflicts
description: >
  Resolve the merge conflicts in the current working tree by combining the intent of both
  branches, not by picking a side. Make code edits only — no git commands. For each conflict,
  read enough of both branches to understand why each side changed the code, then write the
  version that keeps both intents. Do not make blind edits. Use when a merge, rebase, or
  cherry-pick has left conflict markers in the tree, or the user asks to fix / resolve merge
  conflicts. Triggers on /jacks-skills:fix-merge-conflicts.
---

# Fix Merge Conflicts — Combine Intent, Don't Pick a Side

You resolve conflict markers by understanding what each branch was trying to do, then writing
the code that keeps both changes working together. The default failure is a blind edit: keep
one side, delete the other, or paste both together — without reading why either side changed.
That produces code that compiles but silently drops one branch's work. This skill replaces
guessing with reading.

**Core principle:** A conflict is two intents that touched the same lines. Resolve the intent,
not the text. You cannot combine two changes correctly until you know what each one is for.

**Code edits only. No git commands.** You do not run `git checkout --ours/--theirs`, `git add`,
`git commit`, `git merge --abort`, or any other git command. You edit files to remove the
conflict markers and leave correct code. Committing is the user's decision, not yours.

## Workflow

### Step 1: Find every conflict

Search the whole tree for conflict markers so you resolve all of them, not just the first file:

```sh
git --no-pager diff --name-only --diff-filter=U   # files with conflicts
grep -rn '^<<<<<<<\|^=======\|^>>>>>>>' .          # every marker, in case some slipped through
```

Do not run other git commands — this is read-only inspection to build the list. List every
conflicted file before editing any of them.

### Step 2: For each conflict, identify the two intents

Each conflict block is:

```
<<<<<<< HEAD
...our side...
=======
...their side...
>>>>>>> branch-name
```

For each block, answer both questions before you touch it:

- **What is our side (HEAD) doing, and why?** Read the surrounding function — not just the
  conflicting lines — so you know the change's purpose.
- **What is their side doing, and why?** Same: read around it. If the reason is not obvious from
  the code, look at the wider file and the neighboring conflicts. Related conflicts in the same
  file are usually one coherent change split across hunks — read them together.

If the two sides are the same change made two ways, they collapse to one. If they are two
different changes to the same code, the resolution must preserve both.

### Step 3: Write the combined version

Write the code that satisfies both intents. Then remove all three markers. Common shapes:

- **Both add distinct things** (imports, cases, fields, list entries) → keep both, in a sensible
  order, no duplicates.
- **Both edit the same logic differently** → merge the edits so both effects hold. If they truly
  conflict — the same value set two incompatible ways — that is a real decision, not a merge.
  Flag it (Step 5); do not silently pick one.
- **One is a rename/move, the other edits the old form** → apply the edit to the new form.

Never leave a marker behind. Never delete one side's work just because it was easier to keep the
other.

### Step 4: Verify each resolution reads correctly

After editing a file, re-read the resolved region. Check: no markers remain, the code is
syntactically whole (balanced braces/parens, no half-merged statements), and both intents from
Step 2 are visibly present. Do not assume the edit landed — look.

### Step 5: Report

When every conflict is resolved, report:

- Each file, and for each conflict how you combined the two sides (one line each).
- Any conflict you resolved with a genuine judgment call — where the two intents could not both
  hold and you had to choose. Name the choice and why. Recommend, but flag it for the user.
- Confirm no markers remain (`grep -rn '^<<<<<<<\|^=======\|^>>>>>>>' .` returns nothing).

Then stop. The user commits.

## Rules

- **No git commands.** Edits only. Not to stage, not to commit, not to abort, not to check out a
  side.
- **No blind edits.** Every resolution is backed by having read why both sides changed. If you
  did not read their side, you are not ready to resolve it.
- **Keep both intents** unless they are truly mutually exclusive. Dropping one branch's work is
  the failure this skill exists to prevent.
- **Resolve all conflicts**, in every file, not just the first.

## Red flags — stop, you are making a blind edit

- You kept one side without reading what the other side was for → Step 2.
- You typed `git checkout --theirs`, `git add`, or `git commit` → not your call; edit files only.
- You pasted both sides in and left duplicate or contradictory code → Step 3.
- You resolved one file and stopped without checking for other conflicted files → Step 1.
- A marker (`<<<<<<<`, `=======`, `>>>>>>>`) is still in the file → Step 4.
