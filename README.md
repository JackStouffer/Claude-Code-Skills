# Claude Code Skills

These are various skills I've made for my workflow, packaged as a single Claude Code plugin named `jacks-skills`. I don't claim they're the best at what they do, or that they're up to date. Simply that I use them.

Once installed, each skill is invoked under the plugin namespace, e.g. `/jacks-skills:feature-planner`.

## Skills

- `jacks-skills:receiving-feedback`: Verify review feedback against the real sources (code, config, docs) before acting on it, reporting a verdict per claim.
- `jacks-skills:design-concepts`: Generate genuinely divergent UI/UX design options instead of the same idea under different names.
- `jacks-skills:executing-plans`: Execute an already-reviewed implementation plan with todo tracking and per-task verification.
- `jacks-skills:feature-planner`: Write a plan file by breaking down a feature request and then asking a series of questions about the implementation.
- `jacks-skills:plan-splitter`: Break a large implementation plan into smaller, independently executable sub-plans, each leaving the app in a working, verifiable state.
- `jacks-skills:test-audit`: Find low-value tests (tests no plausible bug would fail), report a verdict per test, and delete, rewrite, or merge them once approved.
- `jacks-skills:fix-merge-conflicts`: Resolve the merge conflicts in the current working tree by combining the intent of both branches — code edits only, no git commands.

## Review board (mod)

When `/code-review`, `ce-code-review`, `ce-doc-review`, `ponytail-review`, `ponytail-audit` or `test-audit` finishes, its findings appear in a "Review findings" pane. `/review-board` opens the pane by hand, or brings it back after it was closed or hidden. While findings exist, the status line shows their count. Findings last for the session only.

The pane does not take the keyboard by itself. Run `/review-board` to give it the keyboard. The other way is ctrl+x, release, then Tab (in Ghostty, ctrl+Tab switches tabs, so let go of ctrl first). Clicks reach the pane only in fullscreen mode. In the pane, Tab moves between buttons, Enter presses the highlighted one, and Esc returns to the prompt. The arrows scroll the pane, and the left arrow opens the agents view. Each finding has three buttons:

- **Ignore**: removes the finding from the board.
- **receiving-feedback**: starts a fresh background session in the same directory that runs `/jacks-skills:receiving-feedback` on the finding. The session is in the agents view (`claude agents`).
- **receiving-code-review**: does the same with `/superpowers:receiving-code-review`.

The new session runs `claude-work --bg` if your shell defines `claude-work`, and `claude --bg` if not. It passes on the current session's `--plugin-dir` flags. If the background session does not start, the button starts a background subagent instead: it has its own context and is listed under tasks.

In Ghostty in the terminal, each finding has five buttons: Ignore, then **Run receiving-code-review in Ghostty tab** and **Run receiving-feedback in Ghostty tab**, which open a new Ghostty tab in the same directory that runs the skill on the finding, then **Run receiving-code-review in bg agent** and **Run receiving-feedback in bg agent**, which start a background session as described above. A rerun of the same review replaces its earlier findings.

## Plan progress (mod)

When `jacks-skills:executing-plans` starts a plan, a "Plan progress" pane opens. The skill sends the plan's steps and their statuses through the plugin's `update_plan_progress` tool. The pane shows a checkmark for done, a spinner for in progress, and an empty box for to do. A progress bar is at the bottom. In the fullscreen terminal and the desktop app, an animated Clawd above the steps types at a laptop while a step is in progress and cheers when the plan is done. `/plan-progress` opens the pane again after it was closed.

## Development

The mod is TypeScript. Run `npm install`, then:

- `npm run types`: loads the plugin once so Claude Code writes its API types to `.claude-plugin/types/`. Run it again after a Claude Code update.
- `npm run check`: type-check, lint, format check, and the mod's tests.
- `npm run format`: apply Prettier.

`npm install` also turns on the `.githooks/pre-commit` hook. It runs `npm run check` when a commit touches the TS code or its tooling, and it rejects the commit if a check fails.

## Install

This repo is a Claude Code plugin marketplace. Add it once, then install the plugin:

```
/plugin marketplace add JackStouffer/Claude-Code-Skills
/plugin install jacks-skills@jacks-skills
```

The `feature-planner` skill's `fp-question-gen` agent ships with the plugin and loads automatically — no separate install step.

## Updating

Pull the latest skills straight from git:

```
/plugin marketplace update
/plugin update
```

Because `plugin.json` has no pinned `version`, updates track the repo's latest commit on `main`.
