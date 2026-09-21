A personal collection of Claude Code skills, packaged as a single plugin named `jacks-skills`.

Layout:
- `.claude-plugin/plugin.json` — the plugin manifest.
- `.claude-plugin/marketplace.json` — the marketplace catalog, so the repo is installable/updatable via git.
- `skills/<name>/SKILL.md` — one folder per skill. Skills are invoked namespaced, e.g. `/jacks-skills:<name>`.
- `agents/` — agents bundled with the plugin (e.g. `fp-question-gen`, used by `feature-planner`).
- `tests/<name>/` — the test suite for each skill.

See the `README.md` for the list of skills and install instructions. See each skill's `README.md` for a detailed description.
