First line of your reply must be: `MODEL: <your exact model id>`.

You are judging three UI concepts written for the same brief for divergence.
Brief: {{BRIEF}} Read the three spec
files below in full. Judge the concepts as designs, not the labels the authors
gave them. "Snap", "Drop" and "Sling" can be one idea.

Files:
{{FILES}}

For each pair of concepts, list every design decision where both concepts made
materially the same choice, even if each author named the decision point
differently or one author did not list it as a decision point at all. A choice
counts as the same when a user would experience it the same way (e.g. both
group alerts by source chart; both use swipe-to-dismiss; both use a right-side
slide-over panel). Then rate the pair's overall diversity 1-10 where 1 = same
design with different words and 10 = nothing structural in common.

For each concept, count the options it committed to in its decisions/spec
table, and how many of those are actually visible in the wireframe or
principles. A value is visible only if a reader could identify it from the
concept body without the table.

If each concept has its own options table (not a shared spec), also list
options that appear in two or more concepts' tables, near-verbatim or
semantically identical.

Write {{OUT_PATH}} as JSON only:
{
  "pairs": [
    {"a": "01", "b": "02", "same_choices": ["..."], "same_skeleton": true/false,
     "same_metaphor": true/false, "diversity_1_10": n},
    {"a": "01", "b": "03", ...},
    {"a": "02", "b": "03", ...}
  ],
  "realization": [
    {"concept": "01", "committed": n, "visible": n, "missing": ["..."]},
    ...
  ],
  "enumeration_overlap": ["..."] or null,
  "notes": "two sentences max"
}

Return only the MODEL line and the three diversity scores.
