#!/usr/bin/env bash
# Install skills to ~/.claude/skills/ (and their agents/*.md to ~/.claude/agents/).
# Usage: ./install.sh [--uninstall]   -- interactive, defaults to all skills.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DEST="$HOME/.claude/skills"
AGENTS_DEST="$HOME/.claude/agents"

UNINSTALL=false
[ "${1:-}" = "--uninstall" ] && UNINSTALL=true

# Discover skills: any top-level dir containing a SKILL.md.
skills=()
for dir in "$REPO_DIR"/*/; do
  [ -f "${dir}SKILL.md" ] && skills+=("$(basename "$dir")")
done
[ "${#skills[@]}" -eq 0 ] && { echo "No skills found in $REPO_DIR"; exit 1; }

action=$([ "$UNINSTALL" = true ] && echo "Uninstall" || echo "Install")
echo "$action which skills?"
for i in "${!skills[@]}"; do
  printf "  %d) %s\n" "$((i + 1))" "${skills[$i]}"
done
printf "Enter numbers (comma-separated), or 'all' [all]: "
read -r reply
reply="${reply:-all}"

selected=()
if [ "$reply" = "all" ]; then
  selected=("${skills[@]}")
else
  IFS=', ' read -r -a picks <<< "$reply"
  for p in "${picks[@]}"; do
    if [[ "$p" =~ ^[0-9]+$ ]] && [ "$p" -ge 1 ] && [ "$p" -le "${#skills[@]}" ]; then
      selected+=("${skills[$((p - 1))]}")
    else
      echo "Ignoring invalid choice: $p" >&2
    fi
  done
fi
[ "${#selected[@]}" -eq 0 ] && { echo "Nothing selected."; exit 0; }

for skill in "${selected[@]}"; do
  agents_src="$REPO_DIR/$skill/agents"
  if [ "$UNINSTALL" = true ]; then
    rm -rf "${SKILLS_DEST:?}/$skill"
    if [ -d "$agents_src" ]; then
      for a in "$agents_src"/*.md; do
        [ -e "$a" ] && rm -f "$AGENTS_DEST/$(basename "$a")"
      done
    fi
    echo "Uninstalled $skill"
  else
    mkdir -p "$SKILLS_DEST" "$AGENTS_DEST"
    rm -rf "${SKILLS_DEST:?}/$skill"
    cp -R "$REPO_DIR/$skill" "$SKILLS_DEST/$skill"
    if [ -d "$agents_src" ]; then
      for a in "$agents_src"/*.md; do
        [ -e "$a" ] && cp -f "$a" "$AGENTS_DEST/"
      done
    fi
    echo "Installed $skill"
  fi
done
