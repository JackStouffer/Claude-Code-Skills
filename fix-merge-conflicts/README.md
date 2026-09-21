# fix-merge-conflicts

A skill for resolving merge conflicts in the current working tree by combining the intent of
both branches — code edits only, no git commands.

## The problem

The default failure when resolving a conflict is a blind edit: keep one side, delete the other,
or paste both together without reading why either branch changed the code. That produces
something that compiles but silently drops one branch's work. And reaching for
`git checkout --theirs` or `git add` makes a commit decision that belongs to the user.

## How the skill works

A conflict is two intents that touched the same lines. The skill resolves the intent, not the
text.

1. **Find every conflict** across the whole tree, so all of them get resolved, not just the
   first file.
2. **Identify the two intents** — what our side (HEAD) is doing and why, what their side is doing
   and why — by reading around each block, not just the conflicting lines.
3. **Write the combined version** that satisfies both intents, and remove all markers. Truly
   mutually exclusive changes become a flagged decision, not a silent pick.
4. **Verify** each resolved region: no markers left, code is syntactically whole, both intents
   present.
5. **Report** how each conflict was combined and any judgment calls, then stop. The user commits.

## Core principle

Combine intent, don't pick a side. Code edits only — committing is the user's decision.

## When to use it

When a merge, rebase, or cherry-pick has left conflict markers in the tree, or the user asks to
fix or resolve merge conflicts.
