#!/usr/bin/env python3
"""Print the baseline concept-agent prompt, derived from SKILL.md right now.

usage: baseline.py > variants/current/concept-agent.md

The SKILL.md template's bracketed slots become {{PLACEHOLDER}} tokens, the
output path becomes {{OUT_PATH}}, the frontend-design line is dropped (it
governs aesthetics, not divergence), and a MODEL line is added so the model can
be audited. Nothing else changes, so the baseline can never drift from the skill.
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
skill = open(f"{HERE}/../../jacks-design-concepts/SKILL.md").read()

m = re.search(r"^Concept-agent prompt template:\n```\n(.*?)\n```", skill, re.S | re.M)
if not m:
    sys.exit("could not find the concept-agent template block in SKILL.md")
t = m.group(1)

# Every rewrite below must match exactly once; fail loudly if SKILL.md moved on.
REWRITES = [
    (r"\[exact brief\]", "{{BRIEF}}"),
    (r"\[house-style brief, or \"greenfield - invent per frontend-design\"\]", "{{HOUSE_STYLE}}"),
    (r"\[assigned axis \+ short instruction\]", "{{AXIS}}"),
    (r"\[random string\]", "{{SEED}}"),
    (r"design-concepts/<slug>/NN-name\.md", "{{OUT_PATH}}"),
    (r"\n\nApply the frontend-design skill[^\n]*\n", "\n"),
    (r"^Return only the concept name and one-line core idea\.$",
     "Return only the MODEL line, the concept name and one-line core idea."),
]
for pat, rep in REWRITES:
    t, n = re.subn(pat, rep, t, flags=re.M)
    if n != 1:
        sys.exit(f"expected exactly one match for {pat!r} in SKILL.md template, got {n}; update baseline.py")

# Prose slots are words and punctuation only; the seed math "[4(k-1), 4k)" and
# the python one-liner contain digits or parentheses and are not slots.
if re.search(r"\[[A-Za-z][A-Za-z ,'\"+-]*\]", t):
    sys.exit("unhandled [bracket] slot remains in template; update baseline.py:\n" + t)

print("First line of your reply must be: `MODEL: <your exact model id>`.\n")
print(t)
