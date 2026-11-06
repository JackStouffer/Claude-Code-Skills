First line of your reply must be: `MODEL: <your exact model id>`.

You are judging one feature-plan file that was generated from a confirmed spec.

The confirmed spec (the ONLY input the plan author was given) is at:
{{SPEC_PATH}}

Read the whole spec. All of it is the source of truth: the `## Background`
section (current state and claims from docs and people), every domain section,
the deferred items, and the `## Consolidated spec (confirmed)` section if there
is one. Every goal, non-goal, edge case, design decision, background fact,
background conflict, risk, and open question in it is a checkable item.

The plan to judge: {{PLAN}}

A plan is "acceptable" as an implementation deliverable when ALL of these hold:
1. Every required section is present and non-empty: Overview; Goals; Non-Goals;
   Current State & Verified Facts (required only if the spec has a Background
   section); Detailed Design with User Flow, Data Model, API/Interface, Edge
   Cases & Error Handling, and Design Decisions; Implementation Plan; Open
   Questions.
2. Spec coverage is high: the plan carries the spec's goals, non-goals, decided
   edge cases, chosen design decisions, and background facts. Missing a decided
   item or a background fact is a defect. Background facts about existing code
   belong in Current State & Verified Facts with their source tag. A background
   fact restated as a new goal, requirement, or decision is a defect.
3. No fabrication: `fabricated_items` is empty. A fabricated item is anything the
   plan states that the spec does not support: a requirement, decision, entity,
   field, endpoint detail, constraint, condition, gate, deadline, or risk. Count
   every reason or rationale that the spec does not give, even a plausible one.
   An item the plan clearly marks as not in the spec (for example "Not specified
   in the spec") is not fabricated. One fabricated item makes the plan NOT
   acceptable, however small.
4. Design Decisions state, for each real tradeoff, WHAT was chosen and WHY, with
   the why taken from the spec. This is the highest-value section; a plan that
   lists decisions without the rationale the spec gives is degraded. A decision
   that has no reason in the spec must say `Reason not recorded`.
5. Every deferred or open item in the spec is carried into Open Questions, NOT
   silently resolved or dropped.
6. Every background conflict (a doc or person claim that contradicts the code
   or another claim) is flagged in Open Questions, naming both sides. A plan that
   states one side as fact anywhere, without flagging the conflict, is NOT
   acceptable.
7. Every risk that the spec records without a decision (for example a "must" or
   a "Risk:" line with no chosen mitigation) is carried into Open Questions as an
   open risk, NOT resolved by the plan choosing a mitigation.

Count the spec's checkable items (goals, non-goals, decided edge cases, chosen
design decisions, background facts, background conflicts, undecided risks —
count them yourself from the whole spec) and how many the plan actually
represents. Quote or closely paraphrase the plan's text for each fabricated item.

Write {{OUT_PATH}} as JSON only:
{
  "missing_or_empty_sections": ["..."],
  "spec_items_total": n,
  "spec_items_covered": n,
  "missing_items": ["..."],
  "fabricated_items": ["..."],
  "decision_quality_1_5": n,
  "open_questions_carried": true/false,
  "conflicts_flagged": true/false,
  "undecided_risks_carried": true/false,
  "acceptable": true/false,
  "notes": "two sentences max"
}

`conflicts_flagged` and `undecided_risks_carried` are `true` when the spec has
none of that kind.

Return only the MODEL line and one line: `acceptable` or `not acceptable`, with
the main reason.
