# Concept 03 — Pocket Tuck

## Core idea
Saving is "tucking the item into a pocket": the button is a small pocket/pouch that morphs its flap open, swallows a chip that grows out from center, and seals — replacing the tired filled-vs-outline bookmark entirely.

## Key visual + interaction principles
- **Metaphor: a pocket, not a bookmark.** Default state is a shallow pouch outline with an open flap. Saved state is a sealed, slightly plumped pouch — the item is "inside."
- **Motion is a shape-tween (morph).** The single SVG path continuously interpolates: flap-open → flap-closing-over-chip → sealed-plump. No swap between two static icons; one path bends through the whole arc (~260ms, ease-out then a 40ms settle overshoot for tactility).
- **Pending is honest.** On click the flap lifts and a chip expands from the pocket's center; the seam shows a thin indeterminate shimmer while the save request is in flight. On success it snaps sealed; on failure the flap springs back open and the chip drains.
- **Dual feedback: sound + visual.** A short, soft "click-thunk" (a felt-pocket close) plays on the seal, muted if the OS reports reduced-motion or a muted tab; paired with the morph so audio is reinforcement, never the only signal.
- **Persistent state cue: a badge dot.** After sealing, a small accent dot sits at the pocket's top-right corner — a glanceable "occupied" marker that survives after the animation ends, so state is readable without hover or motion.
- **Un-save: click again = reverse animation.** A second click runs the morph in reverse — flap peels up, chip shrinks back to center and dissipates, dot fades — returning to the open empty pouch. Same button, same spot, no separate control or menu.
- **Spatial anchor: expand from center.** All growth/shrink originates from the pocket's geometric center; the button never jumps position, so the toolbar stays stable.

### Palette (invented, greenfield)
- Pouch stroke / idle: `#5B6472` (slate)
- Chip + saved plump fill: `#E4B23C` (warm amber — "something valuable tucked away")
- Badge dot: `#2FA37C` (teal-green, high-contrast accent)
- In-flight shimmer: `#C9CFD8` sweep on the seam
- Surface: `#F5F4F0` (warm paper)

## ASCII wireframe

```
IDLE (empty pocket, flap open)      PENDING (flap lifting, chip grows,
 ┌──────────────┐                    seam shimmer)
 │   ╱‾‾‾‾‾╲     │                   ┌──────────────┐
 │  │       │    │                   │   ╱▔▔▔▔▔╲    │
 │  │       │    │                   │  │ ░▒▓▒░ │   │  ← chip from center
 │  ╰───────╯    │                   │  │·······│   │  ← shimmer seam
 └──────────────┘                    └──────────────┘

SAVED (sealed, plump, badge dot)     UN-SAVING (2nd click: reverse)
 ┌──────────────┐  •                 ┌──────────────┐
 │  ╭───────╮  (dot)                 │   ╱▔▔▔▔▔╲    │  flap peels up,
 │  │▓▓▓▓▓▓▓│    │                    │  │ ▒░   │    │  chip shrinks to
 │  │▓▓▓▓▓▓▓│    │                    │  ╰───────╯   │  center, dot fades
 │  ╰═══════╯    │  ♪ soft thunk      └──────────────┘
 └──────────────┘
```

## Seed-derived decisions

Seed: `pCNNo6yh7SRRGhmQcgU+qGAe4L1qBRnI`

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Save metaphor (non-bookmark) | 0 pocket/pouch tuck · 1 magnet pull-in · 2 jar/vault deposit · 3 thread/stitch-in · 4 anchor drop | `pCNN` | 383 mod 5 = 0 | **pocket/pouch tuck** |
| 2 | Motion primitive | 0 shape-tween morph · 1 physics fling+settle · 2 fold/origami · 3 liquid fill/drain · 4 particle converge | `o6yh` | 435 mod 5 = 0 | **shape-tween morph** |
| 3 | Feedback modality | 0 color+shape only · 1 haptic+visual · 2 sound+visual · 3 visual+text label | `7SRR` | 246 mod 4 = 2 | **sound+visual** |
| 4 | Persistent saved-state cue | 0 icon shape change only · 1 badge dot · 2 background chip fill · 3 position shift | `hmQc` | 405 mod 4 = 1 | **badge dot** |
| 5 | Un-save affordance | 0 same-button toggle (instant) · 1 long-press to release · 2 reverse animation on click · 3 swipe/drag off | `gU+q` | 366 mod 4 = 2 | **reverse animation on click** |
| 6 | Spatial anchor of animation | 0 in-place (no origin) · 1 animate toward saved-items location · 2 expand from center · 3 drop downward with gravity | `GAe4` | 262 mod 4 = 2 | **expand from center** |

Command run:

```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "pCNNo6yh7SRRGhmQcgU+qGAe4L1qBRnI" 5 5 4 4 4 4
```

Output:

```
[0, 0, 2, 1, 2, 2]
```

## Why this diverges

**From the default solution:** The obvious Save micro-interaction is a bookmark ribbon that toggles outline→filled with a color flip. This concept has no bookmark and no fill-toggle: it is a pocket that physically opens, receives an object, and seals — the state is communicated by container geometry (open vs. sealed-and-plump) plus a corner badge, not by fill.

**From the assigned-axis baseline (Metaphor):** My axis was to leave filled-vs-outline bookmark behind. The seed pushed me to the *containment* metaphor (pocket/pouch tuck, DP1=0) rather than the also-available magnet or anchor readings. Combined with a continuous path morph (DP2=0), an audible felt-pocket "thunk" as second channel (DP3=2), and a literal reverse-morph for un-saving (DP5=2), the interaction reads as putting-away/taking-back an object — a spatial, tactile act — which is categorically distinct from marking a page.
