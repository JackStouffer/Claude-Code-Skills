# Claude Code Skills

These are various skills I've made for my workflow. I don't claim their the best at what they do or they're up to date. Simply that I use them.

## Skills

- jacks-receiving-feedback: Verify review feedback against the real sources (code, config, docs) before acting on it, reporting a verdict per claim.
- acks-design-concepts: Generate genuinely divergent UI/UX design options instead of the same idea under different names.
- jacks-executing-plans: Execute an already-reviewed implementation plan with todo tracking and per-task verification.
- feature-planner: Write a plan file by breaking down a feature request and then asking as series of questions about the implementation.
- jacks-plan-splitter: Break a large implementation plan into smaller, independently executable sub-plans, each leaving the app in a working, verifiable state.
- fix-merge-conflicts: Resolve the merge conflicts in the current working tree by combining the intent of both branches — code edits only, no git commands.

## Install

For Claude Code, user scope only. Run the script for your platform from the repo root and pick the skills you want (defaults to all; existing copies are overwritten):

```sh
./install.sh              # macOS / Linux
```

```powershell
.\install.ps1             # Windows
```

Skills are copied to `~/.claude/skills/<name>/`, and any agent a skill ships (such as feature-planner's `fp-question-gen`) is copied to `~/.claude/agents/`.

To install only specific skills without the prompt, name them as arguments:

```sh
./install.sh feature-planner jacks-plan-splitter
```

```powershell
.\install.ps1 feature-planner jacks-plan-splitter
```

To remove them, run the same script with the uninstall flag and either select the skills to remove or name them:

```sh
./install.sh --uninstall                 # interactive
./install.sh --uninstall jacks-plan-splitter   # named
```

```powershell
.\install.ps1 -Uninstall
.\install.ps1 -Uninstall jacks-plan-splitter
```
