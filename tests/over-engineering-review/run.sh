#!/usr/bin/env bash
# One headless rep. Usage: bash run.sh <skill|short|control> <rep> <fixture> <pr-description> <out-dir>
# --setting-sources project keeps user hooks and plugins (ponytail, routing) out of the run.
set -euo pipefail
arm=$1 rep=$2 fixture=$3 pr=$4 out=$5
repo=$(cd "$(dirname "$0")/../.." && pwd)
SHORT_PLUGIN=${SHORT_PLUGIN:-$repo/tests/over-engineering-review/short-plugin}

args="Review the changes on branch jack/encounter-admin against main (git diff main...HEAD) for over-engineering. Why the change was made, from the PR description:

$(cat "$pr")"

# Each arm loads only its own plugin: with jacks-skills loaded, the control auto-triggers the skill.
case $arm in
  skill) prompt="/jacks-skills:over-engineering-review $args" plugins=(--plugin-dir "$repo") ;;
  short) prompt="/oe-short:over-engineering-short $args" plugins=(--plugin-dir "$SHORT_PLUGIN") ;;
  control) prompt=$args plugins=() ;;
  *) echo "unknown arm $arm" >&2; exit 1 ;;
esac

mkdir -p "$out"
cd "$fixture"
claude -p "$prompt" \
  --model opus \
  --setting-sources project \
  ${plugins[@]+"${plugins[@]}"} \
  --no-session-persistence \
  --output-format stream-json --verbose \
  --allowedTools "Read Grep Glob Agent Task Skill Bash(git:*) Bash(wc:*) Bash(rg:*) Bash(grep:*) Bash(ls:*) Bash(find:*) Bash(sed:*) Bash(cat:*) Bash(head:*) Bash(tail:*)" \
  --disallowedTools "Edit Write NotebookEdit" \
  > "$out/$arm-$rep.jsonl"
