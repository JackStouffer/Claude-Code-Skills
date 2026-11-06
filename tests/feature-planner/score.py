#!/usr/bin/env python3
"""Aggregate <runs>/rep-*/judge.json into a verdict for one fixture.

usage: score.py [runs-dir]   (default: ./runs/spec next to this file)

Each rep dir holds one plan (plan.md) and the judge's judge.json. This prints
the mean of each metric over the reps and lists every rep that failed, with why.

A rep is acceptable only when the judge said so AND every hard rule holds in the
numbers: no missing sections, no fabricated items, open questions carried,
conflicts flagged, undecided risks carried. The judge's own flag is not trusted
alone, because judges let small fabrications through.
"""
import glob, json, os, statistics as st, sys

HERE = os.path.dirname(os.path.abspath(__file__))
RUNS = sys.argv[1] if len(sys.argv) > 1 else f"{HERE}/runs/spec"

reps = sorted(glob.glob(f"{RUNS}/rep-*/judge.json"))
if not reps:
    sys.exit(f"no rep-*/judge.json under {RUNS}")


def failures(p):
    """Every reason this rep is not acceptable; empty means acceptable."""
    why = []
    if p["missing_or_empty_sections"]:
        why.append(f"missing sections {p['missing_or_empty_sections']}")
    if p["fabricated_items"]:
        why.append(f"{len(p['fabricated_items'])} fabricated")
    for key in ("open_questions_carried", "conflicts_flagged", "undecided_risks_carried"):
        if not p[key]:
            why.append(f"{key}=false")
    if not why and not p["acceptable"]:
        why.append("judge: not acceptable")
    return why


rows = {"accept": [], "cov": [], "miss": [], "fab": [], "dq": [], "oq": [], "cf": [], "rk": []}
failed = []
for jpath in reps:
    p = json.load(open(jpath))
    why = failures(p)
    if why:
        failed.append((os.path.basename(os.path.dirname(jpath)), why))
    rows["accept"].append(0 if why else 1)
    rows["cov"].append(p["spec_items_covered"] / (p["spec_items_total"] or 1))
    rows["miss"].append(len(p["missing_or_empty_sections"]))
    rows["fab"].append(len(p["fabricated_items"]))
    rows["dq"].append(p["decision_quality_1_5"])
    rows["oq"].append(1 if p["open_questions_carried"] else 0)
    rows["cf"].append(1 if p["conflicts_flagged"] else 0)
    rows["rk"].append(1 if p["undecided_risks_carried"] else 0)

print(f"\n{len(reps)} reps  ({RUNS})\n")
cols = [("accept-rate", "accept"), ("spec-cov", "cov"), ("miss-sect", "miss"),
        ("fabricated", "fab"), ("decision-q", "dq"), ("oq-carried", "oq"),
        ("conflicts", "cf"), ("risks", "rk")]
for name, k in cols:
    xs = rows[k]
    print(f"  {name:<12}{st.mean(xs):>6.2f} ± {(st.stdev(xs) if len(xs) > 1 else 0.0):.2f}")

print("\nfailed reps:" if failed else "\nno failed reps")
for rep, why in failed:
    print(f"  {rep}: {'; '.join(why)}")
