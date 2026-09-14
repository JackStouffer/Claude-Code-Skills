---
name: jacks-design-concepts
description: Use when asked for multiple UI/UX design options, alternatives, or explorations - "give me some designs for", "redesign this page", "toolbar layouts", "button interactions/animations", "a few concepts for". Beats the mode collapse where every option turns out to be the same idea with different names.
---

# Divergent Design Concepts

## Overview

Asked for several design concepts, independent agents collapse to the same idea. Give three agents the same brief with no coordination and you get three names for one design (verified: "Add to cart" → three agents all produced fly-the-thumbnail-to-the-cart + badge bounce + checkmark).

Beat collapse with three levers, in order of impact:
1. **Pre-assigned orthogonal territories** — each concept is handed a distinct design axis it MUST diverge on, so no two can grab the same default.
2. **Seeded spec selection** — one random string per agent. The agent decomposes the design into decision points, enumerates options per point, and picks each option by arithmetic on a segment of the seed. The seed is a source to sample from, never a vibe to interpret, and it never reaches the design step as text.
3. **A diversity referee** — one agent reads all concepts, flags convergence, and forces pivots.

Why a seed: left to "be creative," a model slides back to its highest-probability default. What moves a model off that default is a per-output *specification* it must visibly satisfy (Zhang, Xin & Zhong 2026); a bare random string in the prompt does little on its own. Here the seed exists only to pick that specification. The arithmetic runs in python, so the string's length and form do not matter, and the seed is generated externally so parallel agents cannot correlate. See the README for sources and `tests/jacks-design-concepts/` in the skills repo for the measured baseline.

All grounded in the existing project's design language so concepts stay compatible with the codebase while still being distinct from each other.

**REQUIRED SUB-SKILL:** every concept agent must apply `frontend-design:frontend-design` for aesthetic quality and anti-templating. This skill orchestrates divergence; that one governs the design itself.

## When to use

- "Give me a few designs / options / concepts for X"
- "Redesign this page" (produce alternatives, not one answer)
- Toolbar layouts, button interactions/animations, empty states, dashboards
- Any open-ended UI exploration prone to the obvious default

**Not for:** a single agreed design (just build it), copy/content-only changes, or pixel tweaks to existing UI. Seeded selection only helps open-ended tasks — never apply it to a task with one correct answer.

## The seeded decision procedure

This is the mechanism each concept agent runs. It converts the seed into a concept skeleton *before* any prose or wireframe is written.

1. **Decompose** the concept into the assigned axis (decision point 0, fixed to your territory) plus 5-7 seeded decision points — the choices that would make two concepts for *this brief* materially different. Derive them from the brief; do not reuse a stock list. Structural choices count as decision points; magnitudes (px, ms) do not. The concept-agent template below carries short examples of the right granularity.
2. **Enumerate** 3-6 concrete candidate options for each seeded decision point, and write the full options table to the spec file *before* computing anything. Enumerate only options you would actually be willing to build — each ships 1-in-n of the time, so a straw man you never wanted ships that often. Still push past the first, obvious option; the default belongs to no one.
3. **Select** each option by running this over the seed (never in your head). Seeded decision point k uses seed chars `[4(k-1), 4k)`; chosen index = `sum(ASCII) mod option_count`, 0-based:
   ```bash
   python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "<seed>" <count_dp1> <count_dp2> ...
   ```
   Fill the "chosen" column from the output. Equal weights only; there is no weighted choice.
4. **Build on that exact combination.** A seed-picked option stands even if a different one "feels better" — overruling it, or reordering the options after seeing the index, is the default sneaking back in.

Territory guarantees divergence *across* concepts on the primary axis; the seed guarantees divergence *across agents* on everything else.

## Workflow

### 0. Scope N and the slug from the request
Small element (one button, one animation) → 3. A page section or toolbar → 4-5. Full page/flow redesign → 6-8. State the number and why.

Derive a short kebab-case `<slug>` from the brief ("Add to cart" → `add-to-cart`, "notification center panel" → `notification-center`). Every `design-concepts/<slug>/…` path below uses it.

### 1. Extract the house style (existing projects only)
Before generating, read the project's real design language so concepts don't clash with the codebase:
- Global stylesheet / tokens (SCSS/CSS variables, theme file), component library in use, 2-3 representative existing screens.
- Write a compact **house-style brief** (5-10 lines): core palette hex values, typefaces + roles, spacing/radius conventions, motion conventions, component primitives. Every concept agent gets this verbatim.

Skip for greenfield/no-project work; the concept agents invent the palette per `frontend-design`.

### 2. Generate seeds + assign territories
Generate one real random string per concept — do not invent them yourself (models invent low-entropy, correlated strings). 32 chars = 8 four-char segments, enough for 7 seeded decision points:
```bash
for i in $(seq 1 N); do printf 'seed %d: ' "$i"; openssl rand -base64 24; done
```
Then assign each concept a **distinct primary divergence axis** from this palette (never repeat an axis within a batch):
- **Spatial model:** radial / timeline / ledger-table / infinite-canvas / stacked-focus / split-pane
- **Interaction model:** direct manipulation / command-driven / progressive disclosure / gesture / hover-reveal / keyboard-first
- **Information density:** sparse single-focus vs dense dashboard
- **Motion language:** instant/none / physics-springy / one choreographed sequence / morphing-transform
- **Metaphor:** drawn from the subject matter — enumerate a handful of concrete domain nouns and let the agent's seed pick one, so the metaphor is sampled, not defaulted
- **Structural device:** borders / numbering / dividers / eyebrows — only if the content earns it

The territory is the primary anti-collapse lever; the seed adds cross-agent variety on every other decision point.

### 3. Phase A — parallel concept agents (one per concept)
Dispatch N agents in a single message, on the default model (do not downgrade — the decompose/enumerate step needs a strong model). Each gets the brief, the house-style brief, its own seed, its own assigned axis, and the template below. Each writes ONE spec file to `design-concepts/<slug>/NN-name.md`.

Concept-agent prompt template:
```
You are generating ONE original UI concept for: [exact brief].

Existing project design language (stay compatible, but be distinct from other
concepts): [house-style brief, or "greenfield - invent per frontend-design"]

Your assigned divergence axis — this is decision point 0, fixed to your territory;
differ here from any default: [assigned axis + short instruction].

Seed (your randomness source — use exactly as given, do NOT invent your own):
[random string]

Apply seeded spec selection. Plan every divergent choice from the seed BEFORE
you design:
1. Decompose this brief into 5-7 seeded decision points: the structural choices
   that would make two concepts for THIS brief materially different (for a
   layout: hierarchy, navigation model, grouping, density, control placement...;
   for a micro-interaction: motion primitive, feedback modality, state cue,
   spatial anchor...). Not magnitudes.
2. For each, enumerate 3-6 concrete candidate options you would actually be
   willing to build — each ships 1-in-n of the time, so no straw men — and push
   past the obvious one. Write the complete options table into the spec file NOW,
   before step 3.
3. Compute the picks with this command (never in your head; equal weights only):
   python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "<seed>" <count_dp1> <count_dp2> ...
   Decision point k uses seed chars [4(k-1), 4k); indices are 0-based. Fill the
   chosen column from the output. A seed-picked option stands even if another
   "feels better"; do not reorder options after seeing the index.
4. Build the concept on that exact combination.

Apply the frontend-design skill for aesthetic quality — no templated defaults.

Write design-concepts/<slug>/NN-name.md with:
- Concept name
- Core idea (1-2 sentences)
- Key visual + interaction principles
- ASCII wireframe
- ## Seed-derived decisions — REQUIRED table, one row per seeded decision point:
  | # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
  plus the exact command you ran and its output.
- Why this diverges from the default solution and from the assigned-axis baseline

Return only the concept name and one-line core idea.
```

### 3.5. Verify each seed table (orchestrator, mechanical)
You hold every agent's seed and each spec file carries its options table. Before the referee runs, re-derive the picks yourself and assert they match — this turns "the chosen column disagrees with the index" from a red flag into a checked precondition. For each spec file, read the per-decision-point option counts (`n`) from its table, then run the same one-liner with that agent's seed:
```bash
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "<that agent's seed>" <count_dp1> <count_dp2> ...
```
The output must equal the spec's "chosen" column, in order. On any mismatch, re-dispatch that concept agent — the agent computed in-head, reordered options after seeing the index, or fabricated the table. Do not hand a mismatched spec to the referee.

### 4. Phase B — diversity referee (one agent)
Give it all N spec files:
```
Here are N UI concepts for [brief]. [paste/point to the N spec files]

Identify any pair/group too similar in layout philosophy, interaction model,
metaphor, or motion language. For each collision, pick one and propose a concrete
pivot that keeps its seed/axis spirit but makes it clearly distinct. Then output a
ranked list of the most diverse, highest-quality concepts, with pivots applied and
a one-line rationale each.
```
Apply the referee's pivots (re-dispatch the pivoted concept agent if the pivot is substantial).

### 5. Render the top picks
Take the referee's top ~3. Dispatch an agent per concept to build a standalone, self-contained `design-concepts/<slug>/NN-name/index.html` (inline CSS/JS, no build step) applying `frontend-design`. Write a `design-concepts/<slug>/INDEX.html` gallery linking them.

### 6. Present
Give the user the gallery path and a one-line summary per concept. Note that `design-concepts/` is scratch — add to `.gitignore` unless they want it committed.

## Common mistakes

| Mistake | Fix |
|---|---|
| Model invents the random string | Generate with `openssl rand` — invented strings are correlated |
| Seed used as a Rorschach blot ("`z` means depth", "`+` means additive") | The seed SELECTS among enumerated options via sum(ASCII) mod n — it is never interpreted for meaning |
| Indices computed in-head, or options reordered after the index is known | Write the options table first, then run the command; the output is final |
| Weighting a choice toward one option | Equal weights only — a weighting is the default with a number on it |
| Padding the options table with a straw man to reach 3-6 | Selection is uniform, so a straw man ships 1-in-n; enumerate only options you'd build |
| Decision points copied from a stock list that doesn't fit the brief (motion/easing for a dashboard) | Decompose for this brief; structural choices, not magnitudes |
| Seed drives only cosmetic knobs (timing, px) while the structural idea is freehand | Every structural decision point is enumerated and seed-selected |
| Overruling a seed-picked option because another "feels better" | That's the default sneaking back; keep the seed's pick |
| Stacking multiple random strings per agent | One seed is enough — 8 four-char segments cover 7 decision points |
| Same axis given to two agents | Each concept gets a unique primary axis |
| Skipping the referee | It's the cheapest collapse insurance; always run it |
| Rendering all N to HTML | Spec-first; render only the top ~3 the referee keeps |
| Ignoring house style | Concepts clash with the codebase and can't ship |
| One agent generates all concepts sequentially | Isolation (separate agents) is what the seeds act on |

## Red flags — you're collapsing

- The `## Seed-derived decisions` table is missing, has no command output, or its "chosen" column disagrees with the computed index
- Every decision point resolved to its first/obvious option
- Concepts share the same metaphor with different names ("Snap"/"Drop"/"Sling" = one idea)
- Every concept has the same layout skeleton
- The referee finds nothing to pivot (it should almost always find at least one collision)

All mean: enforce the seeded procedure, strengthen the territory assignments, and re-run Phase A.
