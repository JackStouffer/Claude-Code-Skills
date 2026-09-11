---
name: jacks-receiving-feedback
description: >
  Verify feedback against the real sources before you act on it. For each claim, look for
  evidence that refutes it as hard as for evidence that confirms it. Check the real sources:
  code, config, migrations, docs, and external references. Report the sources you checked, the
  counterarguments you tested, and a verdict for each claim. If the feedback is correct, list
  the exact places to change. If it is wrong, cite the source that refutes it. Use when you
  receive review feedback on code, a plan, a spec, or a design doc. Use it especially for
  feedback that sounds plausible but that you have not verified. Triggers on
  /jacks-receiving-feedback. Pass the feedback and a pointer to its subject as arguments.
---

# Receiving Feedback — Adversarial Verification

You verify a piece of feedback. You do not implement it. The default failure is sycophantic
agreement: the feedback sounds authoritative, so you accept it and start to change code. This
skill corrects that with a procedure, not a prior. **You do not assume the feedback is wrong.
Instead, you set up each check so that it can come back either way. Then you look.** For every
claim, write down in advance the observation that confirms it and the observation that refutes
it. Then go find both. This makes the check a real search and not a rubber stamp. You do not
bet on the answer. You make sure that you can see the error if the feedback is wrong. The
search for the refuting observation matters because the failure it guards against is invisible
from the inside. That failure is to look only for the confirming observation.

**Core principle:** Verify from the sources, not from memory. Every verdict cites a file that
you read this session. It does not cite something that you recall as true.

## Inputs

`$ARGUMENTS` is the feedback and any pointer to its subject: a file, a plan doc, a PR, or a
function. If the subject is ambiguous, ask once which artifact the feedback is about. Do not
guess and then verify the wrong thing.

## Workflow

### Step 1: Decompose into falsifiable sub-claims

Restate the feedback in your own words. Then break it into the smallest independent claims.
Each claim must be checkable against a source. Compound feedback almost always hides a chain.
For example: "X takes a lock while Y still writes, and Z sets no timeout, so fix W." That is
four claims: lock behavior, concurrent writer, missing config, and correct fix. Each claim is
separately true or false. One false link breaks the conclusion.

Write the sub-claims down before you read anything. This is your test list.

### Step 2: For each claim, name the confirming and the refuting observation — before you look

For each sub-claim, write down both observations. Write the specific observation that confirms
it. For example: `grep` finds a concurrent writer to this table. Write the specific
observation that refutes it. For example: the timeout is set at some file:line. Do this before
you open anything, so that the search can return either answer. The refuting observation is
the whole point. It is easy to look only for the confirmation and to miss that you skipped the
disconfirmation. A claim stands only after you look for its refuting observation and do not
find it.

### Step 3: Identify and read the relevant sources

For each sub-claim, name the source that settles it. Then open it. The correct source depends
on the artifact under review, not on this skill. Code answers to different sources than prose
does:

- **When the subject is code, config, or migrations** — `grep` and Read the real files. Never
  assert what a file contains from memory or from its name.
- **Repo-wide absence claims** — for example "nothing sets a timeout", "no caller passes X",
  or "the spec never mentions rollback". Prove absence with a search across the whole tree or
  the whole doc set. Show the zero-hit result. An unproven absence is not evidence.
- **Behavioral or platform claims** — for example "this DDL takes an exclusive lock" or "this
  default is 0". Confirm them against authoritative behavior. Then check whether the repo
  overrides the default anywhere before you trust it.
- **When the subject is prose — a plan, a spec, or a design doc** — the sources are whatever
  the prose is answerable to. This is usually not more prose. It is the requirement or ticket
  it implements, the ADR or prior design it supersedes or must comply with, a referenced
  standard, and the actual behavior of any system it describes. That behavior lives in code
  and logs, so go read them. "The doc says so" is not a source for whether the doc is right.
  Find the thing that the doc is accountable to. Cite the section or line you relied on, for
  example `DESIGN.md:§TTL` or `TICKET-142.md:11`, exactly as you cite a code line.
- **Reference material the feedback leans on** — any glossary, design reference, or external
  spec the argument cites. It can live in this repo or in a project reference directory that
  the environment points you at. Read it. Do not paraphrase it from memory.

Read whole files around the claim, not just the cited line or section. The surrounding context
often refutes or rescues the claim.

### Step 4: Enumerate counterarguments and test each

Before you rule, list the strongest arguments that the feedback does not apply here. These are
the ways a knowledgeable author defends the existing code. Test each argument against a source.
Typical rescue arguments are:

- "The mechanism is real, but it does not apply to this codebase, path, or property."
- "A default or guard elsewhere already covers it." Then find it, or prove it absent.
- "The claim proves a different property than the one that matters here." Watch for this case
  precisely. For example: write validity against lock contention. The code can be safe on one
  and exposed on the other. Feedback and existing rationale often talk past each other this
  way.
- "It is technically true, but the fix it suggests is the wrong fix."

A counterargument counts only if a source backs it. "It is probably fine" is not a
counterargument. "`grep` shows the guard at file:line" is.

### Step 5: Verdict per claim, then overall

- **REFUTED** — a source contradicts the claim. Cite the file:line that disproves it.
- **CONFIRMED** — a source positively establishes the *exact* property that the claim asserts.
  Cite it. CONFIRMED is stronger than UNREFUTED. It needs evidence *for* the claim, not just
  the absence of evidence against it. Evidence for a *neighboring* property does not count.
  Example: a claim that an index is *needed for performance*. It is CONFIRMED only by evidence
  of the need — table size, query frequency, or a slow plan. A source that shows only that the
  column is queried establishes that an index *applies*, not that it is *needed*. That gap is
  UNREFUTED, not CONFIRMED.
- **UNREFUTED** — you looked for the refuting observation and did not find it. But no source
  positively establishes the claim either. The claim survived. It is not proven. Absence of a
  contradiction is the exact reasoning that Step 3 bans for absence claims. Do not launder it
  into CONFIRMED. Say plainly which verdict you have.
- **CANNOT VERIFY** — the deciding source is unavailable. Say so explicitly. Name what you
  need. Do not pretend a verdict.

Roll the per-claim verdicts up to one overall call. A REFUTED link kills *the conclusion that
depends on it*. But the other links keep their own verdicts. A true claim does not become false
because a sibling was refuted. So map the overall verdict by what actually survives:

- **Incorrect** — Reserve this for when *every* link is REFUTED or CANNOT VERIFY and nothing
  actionable survives. If even one sub-claim is CONFIRMED, the call is at least *partially
  correct*. Do not downgrade it to "incorrect". Do not hedge it as "incorrect as stated". This
  holds even when the refuted link is the feedback's headline conclusion. You score what
  survives, not the headline.
- **Partially correct** — A REFUTED link breaks the stated reasoning, but a CONFIRMED sub-claim
  or a defensible residual action still stands. Name which links hold and which fall. Do not
  flatten this to "incorrect" because one link was refuted. Do not inflate it to "correct"
  because the mechanism was real.
- **Correct** — Every link holds, either CONFIRMED or UNREFUTED. Flag any UNREFUTED link as
  surviving but unproven.

A chain that is only UNREFUTED, with no link positively CONFIRMED, is not disproven. But it is
not proven either. Act on it only with that caveat stated. Do not report it as confirmed.

### Step 6: Report

Output a report, not code changes. Use this structure:

1. **Verdict** — one line: correct, incorrect, or partially correct. State which links hold.
2. **Sources checked** — a table: claim, source (file:line or grep result), and verdict
   (CONFIRMED, UNREFUTED, REFUTED, or CANNOT VERIFY).
3. **Counterarguments considered** — each rescue argument you tested, and why it did or did not
   save the feedback. This part proves that you tried to disprove the feedback.
4. **If the verdict is correct: the exact change list** — the specific files, functions, and
   lines to change. Describe them precisely enough to hand to an implementer. This is the
   payoff: the verification already located every edit site.
5. **If the verdict is incorrect: the refutation** — the source that kills it, stated as fact.
   Do not apologize to the reviewer. Do not hedge.
6. **Open decisions** — any judgment call that the change depends on, for example scope or a
   value to pick. Flag it for the human. Recommend one option. Do not survey them all.

Then stop. **Do not apply changes.** If the verdict is correct, offer to apply the changes and
ask first.

## Rules

- Cite sources that you read *this session*. A verdict without a citation is an opinion.
- No performative agreement. No gratitude to the reviewer. State the verdict.
- The goal is the truth, not a verdict in either direction. The search for the refuting
  observation is a discipline, not a bias toward "wrong". Genuinely correct feedback survives
  the search and ends with a precise change list. Say "correct" as readily as you say "wrong"
  when the sources support it.

## Red flags — stop, you are rubber-stamping

- You assert "there is no X" without a shown search → Step 3.
- You merge "the mechanism is real", "it applies here", and "the fix is right" into one verdict → Step 4.
- You report UNREFUTED as CONFIRMED → Step 5.
