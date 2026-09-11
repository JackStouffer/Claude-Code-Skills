#!/usr/bin/env python3
"""Aggregate <runs>/<variant>/rep-*/judge.json into one table.

usage: score.py [runs-dir]   (default: ./runs next to this file)
"""
import glob, json, os, statistics as st, sys

HERE = os.path.dirname(os.path.abspath(__file__))
RUNS = sys.argv[1] if len(sys.argv) > 1 else f"{HERE}/runs"

for variant in sorted(glob.glob(f"{RUNS}/*/")):
    v = os.path.basename(variant.rstrip("/"))
    reps = sorted(glob.glob(f"{variant}rep-*/judge.json"))
    if not reps:
        continue
    same, div, skel, meta, real, overlap = [], [], [], [], [], []
    print(f"\n== variant {v}  ({len(reps)} reps)")
    print(f"{'rep':<6}{'same/pair':>10}{'div/pair':>10}{'skel':>6}{'meta':>6}{'realiz':>8}{'enum-ovl':>9}")
    for r in reps:
        j = json.load(open(r))
        p = j["pairs"]
        s = st.mean(len(x["same_choices"]) for x in p)
        d = st.mean(x["diversity_1_10"] for x in p)
        k = sum(x["same_skeleton"] for x in p)
        m = sum(x["same_metaphor"] for x in p)
        c = sum(x["committed"] for x in j["realization"])
        vis = sum(x["visible"] for x in j["realization"])
        rz = vis / c if c else float("nan")
        ov = len(j.get("enumeration_overlap") or [])
        same.append(s); div.append(d); skel.append(k); meta.append(m); real.append(rz); overlap.append(ov)
        print(f"{os.path.basename(os.path.dirname(r)):<6}{s:>10.2f}{d:>10.2f}{k:>6}{m:>6}{rz:>8.2f}{ov:>9}")
    sd = lambda xs: st.stdev(xs) if len(xs) > 1 else 0.0
    print(f"{'mean':<6}{st.mean(same):>10.2f}{st.mean(div):>10.2f}{st.mean(skel):>6.1f}{st.mean(meta):>6.1f}{st.mean(real):>8.2f}{st.mean(overlap):>9.1f}")
    print(f"{'sd':<6}{sd(same):>10.2f}{sd(div):>10.2f}{sd(skel):>6.1f}{sd(meta):>6.1f}{sd(real):>8.2f}{sd(overlap):>9.1f}")
