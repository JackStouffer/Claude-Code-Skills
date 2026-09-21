You are helping plan a software feature. Between the FEATURE CONTEXT markers
below is everything you know about it: the seed idea, the understanding confirmed
with the user, and the background gathered from the codebase. You have no access
to the codebase or to any file. This context is all you get. Do not assume
systems, integrations, or behavior the context does not state.

Your job: for each domain listed under QUESTION DOMAINS, produce the open
questions the plan needs answered before the feature can be built. An open
question is one whose answer the context does not settle and whose answer changes
the design. Produce AT MOST SIX questions per domain. Fewer is better: add a
question only when a real undecided point would otherwise go unasked. A domain
with nothing genuinely open gets an empty questions array.

What makes a question good:
- Specific, not generic. Name the actual case. Not "have you considered edge
  cases?" but "If two rows in the file have the same email, do we reject the
  file, skip the duplicates, or keep the last one?"
- Surfaces an unexamined assumption or an undecided tradeoff: a decision the user
  has not realized they need to make.
- Not already answered by the context, and not outside the stated scope.
- Asked once. You are writing every domain, so a decision that spans domains
  (for example, who may use the feature touches both intent and security) goes in
  the single domain that fits it best and nowhere else.
- Offers 2-4 concrete options, each with its tradeoff, so the user picks rather
  than starts from blank. A free-text "other" choice is always available to the
  user, so do not add one.

=== FEATURE CONTEXT ===
[paste the full contents of plan-notes.md]
=== END FEATURE CONTEXT ===

=== QUESTION DOMAINS ===
intent — Intent & scope: why this feature exists, the concrete user problem it
  solves, who the target user is, what success looks like and how it would be
  measured, and what is explicitly OUT of scope.
behavior — Core behavior: the happy path walked step by step, what the user does
  and sees at each stage, the inputs and outputs at each step, and the shape of
  the data model the feature reads and writes.
edgecases — Edge cases & error handling: invalid input, partial failures,
  timeouts, concurrent access, empty states, rate limits, boundary conditions,
  and behavior at the top end of the stated scale.
tradeoffs — Design tradeoffs: the tension points (speed vs. correctness,
  simplicity vs. flexibility, all-or-nothing vs. partial, consistency vs.
  availability) where the user must make an explicit choice instead of having
  one assumed.
integration — Integration & dependencies: how this interacts with existing
  systems and code paths, which APIs, services, and data stores it touches,
  ordering dependencies, migration concerns, and backward-compatibility
  requirements.
ux — UX & presentation: how the feature looks and feels, the feedback the user
  gets, loading / progress / confirmation / undo flows, empty and error states,
  and accessibility.
operability — Operability: how we know it is working, logging / monitoring /
  alerting, how it is configured, feature flags, limits, and the rollback plan.
security — Security & privacy: authentication, authorization, data sensitivity
  and PII handling, audit trails, and abuse / injection vectors.
=== END QUESTION DOMAINS ===

OUTPUT. Do exactly this:
1. For each domain, write the file <out-dir>/<key>.json (for example
   <out-dir>/intent.json) matching this schema:

{
  "domain": "<the domain name, e.g. Intent & scope>",
  "questions": [
    {
      "header": "<=12 character chip label, e.g. 'Dup rows'",
      "question": "the full question text, specific and self-contained",
      "why": "one line: the assumption or risk this question surfaces",
      "options": [
        {"label": "short option label", "description": "the approach and its tradeoff"}
      ]
    }
  ]
}

   Write a file for every domain, including ones with an empty questions array.
   At most six objects in each questions array; 2-4 objects in each options array.
2. Reply with ONLY the list of file paths you wrote, nothing else. Do NOT put the
   questions in your reply.
