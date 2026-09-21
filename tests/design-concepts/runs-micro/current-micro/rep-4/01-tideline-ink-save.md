# Tideline Ink Save

## Core idea
Clicking the bookmark makes teal ink rise from the button's bottom edge and flood
the hollow glyph like a filling tide; the settled fill plus an accent underline is
the persistent "saved" state, with a running count badge and an Undo toast for reversal.

## Key visual + interaction principles
- **Motion = a rising fill, not a color swap.** On click, an ink line sweeps up
  from the button's bottom edge (`clip-path` inset animated top-down, ~220ms
  `cubic-bezier(.2,.7,.3,1)`), so the outline glyph fills in the way water fills a
  vessel. A faint meniscus highlight rides the leading edge.
- **Saved cue is durable and redundant.** Settled state = filled teal glyph **plus**
  a 2px accent underline beneath the icon, readable even for users who miss the motion.
- **Optimistic + silent.** The fill plays and the count increments immediately; the
  network save reconciles in the background. No spinner, no dimming — if the server
  rejects, the fill drains back down (reverse clip) and the count decrements.
- **Feedback modality = count badge.** A small numeric badge (top-right) ticks
  0→1 with a quick vertical roll as the ink settles, giving weight to the action.
- **Un-save = click again + Undo toast.** A second click drains the ink (reverse
  sweep, top→bottom) and pops a brief "Removed · Undo" toast; Undo re-fills.
- **Anchor = bottom edge.** All fill/drain motion originates at and returns to the
  button's bottom edge, reinforcing the tide metaphor and keeping motion off the
  pointer so cursor position never distorts it.

### Palette (invented — teal/aqua on slate)
| token | hex | use |
|---|---|---|
| `--slate-900` | `#1B2430` | toolbar bg |
| `--slate-700` | `#2E3B4E` | idle glyph stroke |
| `--aqua-400` | `#2DD4BF` | ink fill / saved glyph |
| `--aqua-200` | `#7FF0E1` | meniscus highlight |
| `--accent-underline` | `#14B8A6` | saved underline |
| `--badge-ink` | `#0B3B36` | count badge text on aqua |

## ASCII wireframe
```
IDLE (unsaved)                 MID-CLICK (ink rising)         SAVED (settled)
+---------+                    +---------+                    +---------+ (1)
|         |                    |         |                    |  ####   |  <- count badge
|   /\    |  hollow outline    |   /\    |                    |  ####   |     rolls 0->1
|  /  \   |                    |  /~~\   | <- meniscus edge   |  ####   |
|  |  |   |                    |  |##|   |    rising up       |  ####   |
|  |__|   |                    |  |##|   |                    |  ####   |
+---------+                    +---------+                    +---------+
                                                              ---------   <- accent underline

CLICK AGAIN -> ink drains top->bottom, then:
   [ Removed · Undo ]   (toast, ~4s)
```

## Seed-derived decisions
Seed: `Nel7mdGTiSfRelGf8XQnXKjkXIJVP2nQ`

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|---|---|---|---|---|
| 0 | motion primitive (assigned axis) | 0 rising-ink fill · 1 elastic squash-pop · 2 draw-on stroke · 3 ribbon unfurl · 4 particle burst · 5 path-morph outline→fill | `Nel7` | 0 | **rising-ink fill** |
| 1 | feedback modality | 0 visual only · 1 +haptic · 2 +micro-sound · 3 +ephemeral label · 4 +count badge | `mdGT` | 4 | **count badge** |
| 2 | saved-state cue | 0 filled glyph · 1 color only · 2 filled glyph + accent underline · 3 glyph swap→check · 4 filled + bg pill | `iSfR` | 2 | **filled glyph + accent underline** |
| 3 | spatial anchor of motion | 0 pointer origin · 1 glyph center outward · 2 bottom edge upward · 3 top-down | `elGf` | 2 | **bottom edge upward** |
| 4 | pending / optimistic handling | 0 optimistic + silent reconcile · 1 spinner ring · 2 completing arc · 3 dim+disable · 4 optimistic + rollback shake | `8XQn` | 0 | **optimistic + silent reconcile** |
| 5 | un-save affordance | 0 toggle w/ reverse anim · 1 click again → Undo toast · 2 long-press remove · 3 hover reveals × · 4 reverse anim + haptic | `XKjk` | 1 | **click again → Undo toast** |
| 6 | palette / accent | 0 amber-gold on ink-black · 1 teal/aqua on slate · 2 coral on cream · 3 indigo on off-white · 4 emerald on charcoal | `XIJV` | 1 | **teal/aqua on slate** |

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "Nel7mdGTiSfRelGf8XQnXKjkXIJVP2nQ" 6 5 5 4 5 5 5
```
Output:
```
[0, 4, 2, 2, 0, 1, 1]
```

## Why this diverges
- **From the default solution:** the default Save button flips instantly from a gray
  outline to a solid colored glyph on click (an instant color swap, plus maybe a
  tooltip). This concept replaces that with a time-based liquid fill and layers a
  count badge, accent underline, optimistic reconcile, and Undo toast — none of which
  the default carries.
- **From the assigned-axis baseline (motion language):** the axis says diverge from
  the instant color swap. Rather than the obvious "fade" or "scale-pop" alternatives,
  the seed landed on a **rising-ink fill anchored to the bottom edge** — motion that
  reads as a physical filling event with direction and a meniscus, not a tween of one
  property. Reversal reuses the same primitive in reverse (drain), so save and un-save
  share one coherent motion vocabulary.
