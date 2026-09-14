First line of your reply must be: `MODEL: <your exact model id>`.

You are judging two feature-plan files that were both generated from the SAME
confirmed spec. You do not know which model wrote which; they are labelled only
`A` and `B`, and the order is randomised. Judge the plans, not the label.

The confirmed spec (the ONLY input the plan authors were given) is at:
{{SPEC_PATH}}

Read the spec's `## Consolidated spec (confirmed)` section in full — that section
is the source of truth. Every goal, non-goal, edge case, design decision, and
open question there is a checkable item.

The two plans to judge:
- A: {{PLAN_A}}
- B: {{PLAN_B}}

A plan is "acceptable" as an implementation deliverable when ALL of these hold:
1. Every required section is present and non-empty: Overview; Goals; Non-Goals;
   Detailed Design with User Flow, Data Model, API/Interface, Edge Cases & Error
   Handling, and Design Decisions; Implementation Notes; Open Questions.
2. Spec coverage is high: the plan carries the spec's goals, non-goals, decided
   edge cases, and chosen design decisions. Missing a decided item is a defect.
3. No fabrication: the plan does not invent requirements, decisions, entities, or
   constraints that the spec does not support. A weaker model's most dangerous
   failure is confidently adding things that were never decided — count these.
4. Design Decisions state, for each real tradeoff, WHAT was chosen and WHY. This
   is the highest-value section; a plan that lists decisions without the rationale
   the spec gives is degraded.
5. The two spec open questions (retention period; multi-region dedup uniqueness)
   are carried into Open Questions, NOT silently resolved or dropped.

For EACH plan independently, evaluate against the spec. Count the spec's checkable
items (goals, non-goals, decided edge cases, chosen design decisions — count them
yourself from the consolidated spec) and how many the plan actually represents.

Then, blind head-to-head: which plan would an engineer rather implement from?
Judge on faithfulness to the spec, completeness, and decision rationale — not
length or prose polish. Answer `A`, `B`, or `tie`.

Write {{OUT_PATH}} as JSON only:
{
  "plans": {
    "A": {
      "missing_or_empty_sections": ["..."],
      "spec_items_total": n,
      "spec_items_covered": n,
      "fabricated_items": ["..."],
      "decision_quality_1_5": n,
      "open_questions_carried": true/false,
      "acceptable": true/false
    },
    "B": { ... same keys ... }
  },
  "preference": "A" | "B" | "tie",
  "preference_reason": "one line",
  "notes": "two sentences max"
}

Return only the MODEL line and your one-line preference.
