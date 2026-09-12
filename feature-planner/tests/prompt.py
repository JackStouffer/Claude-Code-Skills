#!/usr/bin/env python3
"""Print the Phase-4 plan-writing subagent prompt, derived from SKILL.md now.

usage: prompt.py > runs/prompt.md

Phase 4 is the only thing this suite measures: given a confirmed `plan-notes.md`
spec, a subagent produces a plan file in the fixed structure. The prompt it runs
is the Phase-4 dispatch blockquote plus the Plan-structure block, both lifted
verbatim from SKILL.md so the tested prompt can never drift from the skill. The
notes path and output path become {{NOTES_PATH}} / {{OUT_PATH}} tokens the
orchestrator fills, and a MODEL-report line is prepended so each arm's model can
be audited from its reply. It exits non-zero if SKILL.md moved on, which is the
signal to update this script.
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
skill = open(f"{HERE}/../SKILL.md").read()

# The Phase-4 dispatch instruction is the run of blockquote lines beginning at
# "> Read"; the Plan structure is the fenced block under "#### Plan structure".
bq = re.search(r"^> Read .*(?:\n^>.*)*", skill, re.M)
if not bq:
    sys.exit("could not find the Phase-4 dispatch blockquote in SKILL.md")
instr = re.sub(r"^> ?", "", bq.group(0), flags=re.M)

plan = re.search(r"^#### Plan structure\n+```\n(.*?)\n```", skill, re.S | re.M)
if not plan:
    sys.exit("could not find the '#### Plan structure' block in SKILL.md")
structure = plan.group(1)

# Every rewrite must match exactly once; fail loudly if SKILL.md changed shape.
REWRITES = [
    (r"Read `plan-notes\.md` at `<exact path>`\.",
     "Read the confirmed spec at `{{NOTES_PATH}}`."),
    (r"produce a feature plan in the structure below and save it as a markdown file in the project root\.",
     "produce a feature plan in the structure below and save it to `{{OUT_PATH}}`."),
    (r"\[paste the Plan structure block below verbatim\]",
     "```\n" + structure + "\n```"),
]
for pat, rep in REWRITES:
    instr, n = re.subn(pat, rep, instr)
    if n != 1:
        sys.exit(f"expected exactly one match for {pat!r} in SKILL.md, got {n}; update prompt.py")

print("First line of your reply must be: `MODEL: <your exact model id>`. "
      "Do NOT write the model id into the plan file — the file must read as a "
      "clean deliverable.\n")
print(instr.strip())
