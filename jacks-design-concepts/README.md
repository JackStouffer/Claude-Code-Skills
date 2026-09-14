# jacks-design-concepts

A skill for generating several different UI/UX design concepts from one prompt.

## The problem

LLMs tend to converge on steriotypical design language in the same way it tends to
converge on steriotypical prose (a.k.a. "claude-ese"). Forcing creativity is difficult. 

## How the skill counters it

Three levers, in order of impact:

1. **Pre-assigned orthogonal territories.** Each concept is handed a distinct design
   axis it must diverge on, so no two agents can grab the same default.
2. **Seeded spec selection.** Each agent gets one externally generated random
   string, decomposes the design into decision points, enumerates options per point,
   and selects each option by arithmetic on a segment of the seed — sampling, not
   interpreting. The string itself never reaches the design step.
3. **A diversity referee.** One agent reads all concepts, flags convergence, forces
   pivots.

## Research Basis

**What actually produces diversity is a per-output specification, not a random
string.** Zhang, Xin & Zhong classify test-time diversity methods by what the
per-output source carries. Level 1 sources (a random string, a nonce) carry no
semantic content about the output; Level 2 sources specify the output along several
dimensions (tone, structure, focus). Across five tasks and four models, Level 2
methods beat every Level 1 and Level 0 baseline on every diversity metric at equal
quality. Their "Keyword" method is close to this skill's Phase A: enumerate
orthogonal axes with candidate values, pick one value per axis, and require every
value to be visibly present in the output. Their measurement of plain SSoT (a
random string the model generates and then conditions on) found a transmission
score near zero, output entropy far below Level 2 methods, and diversity at or below
direct generation on the models they tested. That measurement was on non-reasoning
models only and conflicts with the SSoT authors' own results on deepseek-r1, so treat
it as contested. It does not describe this skill either way: here the string is
consumed by python to choose a Level 2 spec, and the spec is what the agent sees.

> Zhang, Cheng, Rui Xin, and Chudi Zhong. *Where You Inject Diversity Matters: A
> Unified Framework for Diverse Generation.* arXiv:2606.10302, June 2026.

**The seed-segment-and-modulo mechanic comes from String Seed of Thought.** The SSoT
paper observed that when asked to write diverse text from a self-generated random
string, reasoning models spontaneously decompose the task into components, enumerate
candidates per component, and pick each by `sum(ASCII) mod n` on a segment of the
string. This skill makes that observed strategy explicit and mandatory.

Two deviations from the paper, both deliberate. First, the seed is generated
externally with `openssl rand` rather than by the model. The paper tested this
("Seed Injection", Appendix D.6) and found it slightly *worse* than a self-generated
string on NoveltyBench: Distinct 6.00 vs 6.19, baseline 4.70. The authors attribute
the gap to a single external string limiting the model's ability to draw randomness
several times for local decisions, and to the model being better at manipulating
strings it chose itself. This skill addresses both causes: the 32-char seed is split
into eight 4-char segments so each decision point gets its own draw, and the
arithmetic runs in python rather than in the model's head, so the string's length and
character set are irrelevant. External generation is kept because parallel agents
inventing their own strings cannot be guaranteed independent. Second, the model does
not compute anything itself; the SSoT authors note the method degrades on models
that cannot reliably devise and execute the modulo or hashing step in their head.

> Misaki, Kou, and Takuya Akiba. *String Seed of Thought: Prompting LLMs for
> Distribution-Faithful and Diverse Generation.* ICLR 2026. arXiv:2510.21150
> (v1 24 Oct 2025, v3 5 Feb 2026). Blog summary: https://pub.sakana.ai/ssot/

**Secondary.** Agrawal & Goyal show that prepending random, unrelated words to a
prompt raises output diversity on list-style questions. Zhang et al. classify this
as a Level 1 method alongside SSoT. It is background for why randomness in the
prompt helps at all, not a basis for this skill's mechanism.

> Agrawal, Pulin, and Prasoon Goyal. *Addressing LLM Diversity by Infusing Random
> Concepts.* arXiv:2601.18053, 26 Jan 2026.

## Why Phase A was not rebuilt on Zhang's Keyword construction

Zhang et al. would suggest a specific change: enumerate the decision axes once,
share them across all concepts, and pick the N combinations by greedy max-min
Hamming distance so no two concepts agree on any axis. The current skill instead
lets each agent enumerate its own options and draw independently, which offers no
such guarantee. On paper the shared-table version is strictly better.

It was tested before adopting it. `tests/jacks-design-concepts/` (at the repo
root) holds a reusable divergence suite: a
fixed brief, the baseline Phase A prompt, a judge rubric, and a scorer. Proposal
variants and run outputs are not committed; the record of a run is this section.
The 2026-09-11 run used 5 reps of 3 concepts per variant on Opus 4.8, one judge per
rep. The proposal variant enumerated six axes once per rep with a planner agent,
picked three combinations by greedy max-min Hamming distance seeded from
`openssl rand`, and told each agent every value "MUST be clearly and visibly
present", following Zhang's Keyword output prompt.

| mean over 5 reps | current | Keyword-style |
|---|---|---|
| materially same choices per pair (lower is better) | 2.47 | 3.07 |
| judged pairwise diversity, 1-10 | 7.33 | 7.20 |
| pairs sharing a layout skeleton, of 3 | 0.6 | 1.4 |
| spec values visibly realized in the concept | 1.00 | 0.99 |

The shared-table variant did not reduce experienced collisions and produced more
shared skeletons. The judge notes point to why. Hamming distance is computed on
option labels, but a planner's options within one axis are often semantically kin
("snooze until a datetime" vs "snooze until a condition"), and every "cluster by X"
option realizes as the same fixed-sections-with-counts panel regardless of X. In one
rep all three concepts landed on that single skeleton despite differing on every
axis. Independent enumeration, by contrast, produced more heterogeneous structural
options because each agent enumerated with its assigned territory already in mind,
and the territory is what carried the divergence. The agents' option *vocabularies*
did overlap heavily, as predicted, but their committed choices did not.

The differences are within noise for this sample size. The conclusion is not that
the current design is better, only that the predicted failure did not appear, and a
change without a failing baseline is not justified. Zhang's realization finding was
confirmed for both variants: every committed value was visible in the concept, so
the "source ignored during generation" problem they measured for plain SSoT does not
arise when the string selects a spec rather than being read as text.

A narrower brief with fewer natural structural options might collide more. The suite
is set up to rerun on a different brief.

## Why the axis palette was not split by brief type

Feedback argued the single axis palette is layout-shaped and collapses on
micro-interaction/animation briefs, and proposed a second, motion-specific palette
(motion primitive / feedback modality / timing structure) with the axis subset
seed-selected per brief. This is exactly the narrower-brief case flagged above, so it
was tested before adopting.

The 2026-09-11 micro run used `tests/jacks-design-concepts/brief-micro.md` — the click-to-confirm animation
for a single "Save" icon button, N=3, greenfield — 5 reps of 3 concepts on Opus 4.8,
one judge per rep. Two arms differed only in which palette the three territories came
from: `current-micro` (the current layout-shaped palette) vs `motion-palette` (the
proposed motion palette). The Phase A template was identical across arms.

| mean over 5 reps | current-micro | motion-palette |
|---|---|---|
| materially same choices per pair (lower is better) | 4.93 | 5.07 |
| judged pairwise diversity, 1-10 | 5.67 | 6.00 |
| pairs sharing a layout skeleton, of 3 | 0.8 | 1.2 |
| pairs sharing a metaphor, of 3 | 1.4 | 0.6 |
| spec values visibly realized in the concept | 1.00 | 1.00 |

The motion palette did not fix the primary metric: same-choices-per-pair was flat
(5.07 vs 4.93) and shared skeletons rose (1.2 vs 0.8). Its only gain was on metaphor —
it more than halved shared-metaphor pairs (0.6 vs 1.4), breaking up a bookmark-metaphor
cluster (dog-ear / ink-fill / tide-fill) that the layout arm fell into. But that
failure is already addressable by the existing **Metaphor** axis in the one palette,
and the signal is within noise at this sample size. The territory+seed mechanism
carried the divergence regardless of which vocabulary labeled the territories, so
swapping labels bought nothing on the metric that matters. The micro brief did collide
more in absolute terms than the layout brief (4.93 vs 2.47 same/pair), confirming micro
briefs are harder — but the palette split was not the fix. No failing baseline, so the
palette was not split and the axis-subset selection was not seeded.

Three lower-risk items from the same feedback were applied directly, being
wording/mechanical rather than divergence-behaviour changes: deriving a `<slug>` from
the brief for the output paths, reframing option enumeration as "only options you'd be
willing to build" (each ships 1-in-n, so straw men ship that often), and an
orchestrator step that re-runs the seed one-liner and asserts it matches each spec's
"chosen" column before the referee runs.
