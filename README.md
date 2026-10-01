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
- **receiving-feedback**: opens a new Ghostty tab in the same directory and starts a fresh session that runs `/jacks-skills:receiving-feedback` on the finding.
- **receiving-code-review**: does the same with `/superpowers:receiving-code-review`.

The new tab runs `claude-work` if your shell defines it, and `claude` if not. It passes on the current session's `--plugin-dir` flags. Outside Ghostty, the button starts a background subagent instead: it has its own context and is listed under tasks. A rerun of the same review replaces its earlier findings.

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
