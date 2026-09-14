#!/usr/bin/env python3
"""Print the Phase-2 question-generation prompt, derived from the skill now.

usage: prompt.py <out-dir>   (the directory the agent writes <key>.json files to)

The prompt is the skill's own `question-gen-prompt.md`, read verbatim so the
tested prompt can never drift from the skill. The plan-notes placeholder is
replaced with background.md (the fixture standing in for plan-notes.md at the
start of Phase 2) and <out-dir> with the given path. A MODEL-report line is
prepended so the arm's model can be audited from its reply. Exits non-zero if
the placeholders moved, which is the signal to update this.
"""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))

if len(sys.argv) != 2:
    sys.exit(__doc__)
out_dir = sys.argv[1]

prompt = open(f"{HERE}/../../question-gen-prompt.md").read().rstrip()
background = open(f"{HERE}/background.md").read().strip()
for token, rep in [("[paste the full contents of plan-notes.md]", background),
                   ("<out-dir>", out_dir)]:
    if token not in prompt:
        sys.exit(f"expected {token!r} in question-gen-prompt.md; update prompt.py")
    prompt = prompt.replace(token, rep)

print("First line of your reply must be: `MODEL: <your exact model id>`. "
      "Then the file paths, as instructed below.\n")
print(prompt)
