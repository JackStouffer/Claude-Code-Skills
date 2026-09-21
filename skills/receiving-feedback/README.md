# receiving-feedback

A skill for verifying review feedback against the real sources before acting on
it, reporting a verdict per claim.

## The problem

The default failure when receiving feedback is sycophantic agreement: the
feedback sounds authoritative, so it gets accepted and code starts changing —
before anyone checked whether it's actually true. Confirming evidence is easy to
find; the refuting evidence that would show the feedback is wrong is invisible
from the inside if you never look for it.

## How the skill works

It verifies feedback — it does not implement it. The correction is a procedure,
not a prior: it doesn't assume the feedback is wrong, it sets up each check so it
can come back either way, then looks.

1. **Decompose** the feedback into the smallest independent, falsifiable
   sub-claims. Compound feedback almost always hides a chain, and one false link
   breaks the conclusion.
2. **Name both observations** — the one that confirms each claim and the one that
   refutes it — *before* reading anything.
3. **Read the real sources.** Code answers to code, config, migrations; prose
   answers to the ticket, ADR, or system behavior it's accountable to — not to
   more prose. Absence claims require a shown zero-hit search.
4. **Test counterarguments**, the ways a knowledgeable author would defend the
   existing code. A counterargument counts only if a source backs it.
5. **Verdict per claim** — REFUTED, CONFIRMED, UNREFUTED, or CANNOT VERIFY —
   rolled up to an overall correct / partially correct / incorrect call that
   scores what survives, not the headline.
6. **Report**, don't apply. Every verdict cites a file read this session. If the
   feedback is correct, the report includes the exact change list; if wrong, the
   source that refutes it.

## Core principle

Verify from the sources, not from memory. A verdict without a citation is an
opinion.

## When to use it

When you receive review feedback on code, a plan, a spec, or a design doc —
especially feedback that sounds plausible but is unverified. Pass the feedback
and a pointer to its subject as arguments.
