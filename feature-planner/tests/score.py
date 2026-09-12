#!/usr/bin/env python3
"""Aggregate <runs>/rep-*/judge.json into a per-model verdict.

usage: score.py [runs-dir]   (default: ./runs next to this file)

Each rep dir holds two blinded plans and one judge.json keyed by A/B, plus a
mapping.json the orchestrator wrote ({"A": "opus", "B": "sonnet"}) that un-blinds
them. This attributes every judged plan to its model and prints, per model: the
acceptable rate, spec coverage, mean missing sections, mean fabricated items, and
mean decision quality. Then the blind head-to-head: how often each model's plan
was preferred. That table is the answer to "is Sonnet acceptable".
"""
import glob, json, os, statistics as st, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
RUNS = sys.argv[1] if len(sys.argv) > 1 else f"{HERE}/runs"

by_model = defaultdict(lambda: {"accept": [], "cov": [], "miss": [], "fab": [], "dq": [], "oq": []})
wins = defaultdict(int)
ties = 0
reps = sorted(glob.glob(f"{RUNS}/rep-*/judge.json"))
if not reps:
    sys.exit(f"no rep-*/judge.json under {RUNS}")

for jpath in reps:
    d = os.path.dirname(jpath)
    mapping = json.load(open(f"{d}/mapping.json"))  # {"A": model, "B": model}
    j = json.load(open(jpath))
    for letter, model in mapping.items():
        p = j["plans"][letter]
        tot = p["spec_items_total"] or 1
        m = by_model[model]
        m["accept"].append(1 if p["acceptable"] else 0)
        m["cov"].append(p["spec_items_covered"] / tot)
        m["miss"].append(len(p["missing_or_empty_sections"]))
        m["fab"].append(len(p["fabricated_items"]))
        m["dq"].append(p["decision_quality_1_5"])
        m["oq"].append(1 if p["open_questions_carried"] else 0)
    pref = j["preference"]
    if pref == "tie":
        ties += 1
    else:
        wins[mapping[pref]] += 1

print(f"\n{len(reps)} reps  ({RUNS})\n")
cols = [("accept-rate", "accept"), ("spec-cov", "cov"), ("miss-sect", "miss"),
        ("fabricated", "fab"), ("decision-q", "dq"), ("oq-carried", "oq")]
hdr = f"{'model':<10}" + "".join(f"{c[0]:>13}" for c in cols)
print(hdr)
for model in sorted(by_model):
    m = by_model[model]
    row = f"{model:<10}"
    for _, k in cols:
        xs = m[k]
        row += f"{st.mean(xs):>7.2f}±{(st.stdev(xs) if len(xs) > 1 else 0.0):<5.2f}"
    print(row)

print(f"\nhead-to-head (blind preference):")
for model in sorted(by_model):
    print(f"  {model:<10} preferred in {wins[model]} reps")
print(f"  ties: {ties}")
