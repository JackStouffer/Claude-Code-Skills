# Claude Code Skills

These are various skills I've made for my workflow, packaged as a single Claude Code plugin named `jacks-skills`. I don't claim they're the best at what they do, or that they're up to date. Simply that I use them.

Once installed, each skill is invoked under the plugin namespace, e.g. `/jacks-skills:feature-planner`.

## Skills

- `jacks-skills:receiving-feedback`: Verify review feedback against the real sources (code, config, docs) before acting on it, reporting a verdict per claim.
- `jacks-skills:design-concepts`: Generate genuinely divergent UI/UX design options instead of the same idea under different names.
- `jacks-skills:executing-plans`: Execute an already-reviewed implementation plan with todo tracking and per-task verification.
- `jacks-skills:feature-planner`: Write a plan file by breaking down a feature request and then asking a series of questions about the implementation.
- `jacks-skills:plan-splitter`: Break a large implementation plan into smaller, independently executable sub-plans, each leaving the app in a working, verifiable state.
- `jacks-skills:fix-merge-conflicts`: Resolve the merge conflicts in the current working tree by combining the intent of both branches — code edits only, no git commands.

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
