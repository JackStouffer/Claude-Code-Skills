A personal collection of Claude Code skills, packaged as a single plugin named `jacks-skills`.

Layout:
- `.claude-plugin/plugin.json` — the plugin manifest.
- `.claude-plugin/marketplace.json` — the marketplace catalog, so the repo is installable/updatable via git.
- `skills/<name>/SKILL.md` — one folder per skill. Skills are invoked namespaced, e.g. `/jacks-skills:<name>`.
- `agents/` — agents bundled with the plugin (e.g. `fp-question-gen`, used by `feature-planner`).
- `hooks/register.tsx` — the plugin's mod (function hooks), named by `hooks/hooks.json`; its `$.state` contract is `types/index.d.ts`.
- `tests/<name>/` — the test suite for each skill, and for the mod (`tests/review-board/`, run with `claude plugin test .`).
- `.githooks/pre-commit` — rejects commits that touch TS code or its tooling unless `npm run check` passes; `npm install` enables it.

TS rule: if you modify any TS code (`hooks/`, `types/`, `tests/review-board/`, any `.ts`/`.tsx`) or its tooling (`package.json`, `tsconfig.json`, `eslint.config.js`, Prettier config), run `npm run check` and make every check pass (typecheck, lint, format, tests) before you report the work done. Run `npm run types` first if `.claude-plugin/types/` is missing. Do not disable a check to make it pass.

See the `README.md` for the list of skills and install instructions. See each skill's `README.md` for a detailed description.
