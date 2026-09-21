#!/usr/bin/env python3
"""Print the Phase-4 plan-writing subagent prompt, derived from SKILL.md now.

usage: prompt.py > runs/prompt.md

Phase 4 is the only thing this suite measures: given a confirmed `plan-notes.md`
spec, a subagent produces a plan file in the fixed structure. The prompt it runs
is the Phase-4 dispatch blockquote from SKILL.md, with the skill's
`plan-structure.md` inlined in place of the instruction to go read it, so the
tested prompt can never drift from the skill. Inlining (rather than passing the
path through) keeps an archived runs/rep-N/prompt.md a complete record of what
that rep actually ran; the tradeoff is that the agent is not exercised on
reading the structure file itself, as it would be in production. The notes path
and output path become {{NOTES_PATH}} / {{OUT_PATH}} tokens the orchestrator
fills, and a MODEL-report line is prepended so each arm's model can be audited
from its reply. It exits non-zero if the skill moved on, which is the signal to
update this script.
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = f"{HERE}/../../skills/feature-planner"
skill = open(f"{SKILL_DIR}/SKILL.md").read()

# First "> Read" blockquote run is Phase 4's; Phase 5's comes later.
bq = re.search(r"^> Read .*(?:\n^>.*)*", skill, re.M)
if not bq:
    sys.exit("could not find the Phase-4 dispatch blockquote in SKILL.md")
instr = re.sub(r"^> ?", "", bq.group(0), flags=re.M)

structure = open(f"{SKILL_DIR}/plan-structure.md").read().strip()

# Every rewrite must match exactly once; fail loudly if SKILL.md changed shape.
REWRITES = [
    (r"Read `plan-notes\.md` at `<exact path>`\.",
     "Read the confirmed spec at `{{NOTES_PATH}}`."),
    (r"produce a feature plan and save it as a markdown file in the project root\.",
     "produce a feature plan and save it to `{{OUT_PATH}}`."),
    # Trailing space is consumed so the closing fence keeps its own line.
    (r"Follow the plan structure in `plan-structure\.md` in this skill's folder "
     r"\(read it at `<exact path>`\) exactly\. ",
     "Follow this plan structure exactly:\n\n```\n" + structure + "\n```\n\n"),
]
for pat, rep in REWRITES:
    instr, n = re.subn(pat, rep, instr)
    if n != 1:
        sys.exit(f"expected exactly one match for {pat!r} in SKILL.md, got {n}; update prompt.py")

print("First line of your reply must be: `MODEL: <your exact model id>`. "
      "Do NOT write the model id into the plan file — the file must read as a "
      "clean deliverable.\n")
print(instr.strip())
