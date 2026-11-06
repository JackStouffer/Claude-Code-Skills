#!/usr/bin/env bash
# Runs every rep in parallel. Usage: bash run-all.sh <fixture> <pr-description> <out-dir> <arm:rep>...
set -uo pipefail
fixture=$1 pr=$2 out=$3
shift 3
here=$(dirname "$0")
mkdir -p "$out"
start=$(date +%s)
pids=()
for spec in "$@"; do
  arm=${spec%:*} rep=${spec#*:}
  (
    bash "$here/run.sh" "$arm" "$rep" "$fixture" "$pr" "$out" 2>"$out/$arm-$rep.err"
    echo "$arm-$rep exit=$? t=$(($(date +%s) - start))s"
  ) &
  pids+=($!)
done
wait "${pids[@]}"
