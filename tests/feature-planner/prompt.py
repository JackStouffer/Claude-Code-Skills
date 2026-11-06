#!/usr/bin/env python3
"""Print the plan-writer (Phase 5) prompt for one fixture, derived from SKILL.md now.

usage: prompt.py [fixture]   (default: spec.md next to this file)

This suite measures only the plan-writing step: given a confirmed `plan-notes.md`,
the `jacks-skills:fp-plan-writer` agent produces a plan file in the fixed
structure. The prompt is the Phase-5 dispatch blockquote from SKILL.md with the
fixture and the skill's `plan-structure.md` pasted where the skill pastes
`plan-notes.md` and `plan-structure.md`, so the tested prompt cannot drift from
the skill and an archived runs/.../prompt.md is a complete record of the rep.
The output path becomes an {{OUT_PATH}} token the orchestrator fills. It exits
non-zero if the skill moved on, which is the signal to update this script.
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = f"{HERE}/../../skills/feature-planner"
skill = open(f"{SKILL_DIR}/SKILL.md").read()
fixture = sys.argv[1] if len(sys.argv) > 1 else f"{HERE}/spec.md"

bq = re.search(r"^> Below is a complete, confirmed feature spec.*(?:\n^>.*)*", skill, re.M)
if not bq:
    sys.exit("could not find the Phase-5 dispatch blockquote in SKILL.md; update prompt.py")
instr = re.sub(r"^> ?", "", bq.group(0), flags=re.M)

# Every placeholder must appear exactly once; fail loudly if SKILL.md changed shape.
# Literal replace, not re.sub: the pasted files contain backslashes and brackets.
REWRITES = [
    ("`<exact output path>`", "`{{OUT_PATH}}`"),
    ("`<full contents of plan-notes.md>`", open(fixture).read().strip()),
    ("`<full contents of plan-structure.md>`", open(f"{SKILL_DIR}/plan-structure.md").read().strip()),
]
for old, new in REWRITES:
    n = instr.count(old)
    if n != 1:
        sys.exit(f"expected exactly one {old!r} in the Phase-5 blockquote, got {n}; update prompt.py")
    instr = instr.replace(old, new)

print(instr.strip())
