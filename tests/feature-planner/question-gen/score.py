#!/usr/bin/env python3
"""Aggregate <runs>/rep-*/judge.json into a per-domain and overall verdict.

usage: score.py [runs-dir]   (default: ./runs next to this file)

Each rep's judge.json holds a `domains` map keyed by domain name, each with the
question-quality scores from judge.md. This averages every metric per domain
across reps, then prints an overall line. The headline is `useful/6` (mean useful
questions per domain out of the six the agent was allowed) and `accept-rate`
(fraction of domain-sets the judge would send to the user as-is). `offbase` is the
mean count of questions built on invented facts / out of scope / redundant — the
weak-model failure to watch even when useful_count looks fine.
"""
import glob, json, os, statistics as st, sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
RUNS = sys.argv[1] if len(sys.argv) > 1 else f"{HERE}/runs"

reps = sorted(glob.glob(f"{RUNS}/rep-*/judge.json"))
if not reps:
    sys.exit(f"no rep-*/judge.json under {RUNS}")

# metric key -> how to reduce a per-domain record to a number (None = skip nulls)
METRICS = [
    ("useful", lambda p: p["useful_count"]),
    ("total", lambda p: p["total_count"]),
    ("specif", lambda p: p["specificity_1_5"]),
    ("assump", lambda p: p["assumption_surfacing_1_5"]),
    ("on-dom", lambda p: p["on_domain"]),
    ("non-red", lambda p: p["non_redundant"]),
    ("opt-q", lambda p: p.get("options_quality_1_5")),
    ("offbase", lambda p: len(p.get("offbase_or_redundant", []))),
    ("accept", lambda p: 1 if p["acceptable"] else 0),
]

per_domain = defaultdict(lambda: defaultdict(list))
for jpath in reps:
    domains = json.load(open(jpath))["domains"]
    for dom, rec in domains.items():
        for name, fn in METRICS:
            v = fn(rec)
            if v is not None:
                per_domain[dom][name].append(v)


def cell(xs):
    if not xs:
        return f"{'-':>11}"
    m = st.mean(xs)
    s = st.stdev(xs) if len(xs) > 1 else 0.0
    return f"{m:>5.2f}±{s:<4.2f}"


print(f"\n{len(reps)} reps  ({RUNS})\n")
hdr = f"{'domain':<22}" + "".join(f"{n:>11}" for n, _ in METRICS)
print(hdr)
print("-" * len(hdr))
for dom in sorted(per_domain):
    row = f"{dom:<22}" + "".join(cell(per_domain[dom][n]) for n, _ in METRICS)
    print(row)

# overall = pool every domain-rep observation together
print("-" * len(hdr))
pooled = defaultdict(list)
for dom in per_domain:
    for name, _ in METRICS:
        pooled[name] += per_domain[dom][name]
print(f"{'OVERALL':<22}" + "".join(cell(pooled[n]) for n, _ in METRICS))
print(f"\naccept-rate = fraction of the {len(reps)}*8 domain-sets the judge would "
      f"send to the user as-is.")
print("useful = mean useful questions per domain (out of 6 allowed); "
      "offbase = mean invented/OOS/redundant questions per domain.")
