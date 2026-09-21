# Origami Dog-Ear Save

## Core idea
Saving folds the bookmark's top-right corner down like dog-earing a page: the
outline creases along a diagonal, springs into a filled amber ribbon, and
leaves a permanent folded corner as the "saved" mark. Un-saving unfolds it
back flat.

## Palette (greenfield — invented)
- Canvas / paper base: `#F4EFE6`
- Ink outline (unsaved icon): `#3A3D4A`
- Saved ribbon fill: gradient `#E8A33D` → `#C77B2B` (saffron to burnt amber)
- Crease highlight: `#FBF6EC`
- Focus ring: `#5B6CFF` (indigo)

## Key visual + interaction principles
- The icon is a paper bookmark drawn as an outline. Motion is a physical
  paper fold, not a fill or a recolor.
- **Fold origin is the top-right corner.** On click the corner creases along a
  45° diagonal and folds inward; the revealed triangle carries the amber fill.
- **Spring physics.** The fold overshoots slightly past flat and settles —
  it feels like snapping a crease, not a linear tween.
- **Pending = mid-fold hold.** While the save request is in flight the corner
  pauses partway folded with the crease line visible; it completes the fold
  only on server ack (or optimistically, then reconciles).
- **Saved cue = the persistent dog-ear.** Even at rest, the folded top-right
  corner and its amber triangle stay. That folded corner IS the saved state —
  no separate badge, dot, or label.
- **Purely visual feedback.** No haptics, no sound, no text. The fold reads on
  its own.
- **Un-save = exact reverse.** Click again and the corner unfolds back to the
  flat ink outline along the same diagonal, same spring.
- Accessibility: `aria-pressed` toggles, `title`/`aria-label` swap
  "Save" / "Saved", visible indigo focus ring, `prefers-reduced-motion`
  collapses the fold to a 1-frame state change (the one allowed color swap).

## ASCII wireframe

```
UNSAVED (rest)          PENDING (mid-fold hold)     SAVED (rest)
 ______                  _____/|                     ____ /|
|      |                |     \|  <- crease held    |    \\|  <- dog-ear
|      |                |      |     partway        |     ||     stays
|      |                |      |                    |     ||     amber
| ink  |                | ink  |                    |amber||     filled
|      |                |      |                    | fill||
|__  __|                |__  __|                    |__ __||
|    |                  |    |                      |   |
' tab'                  'tab '                      'tab'
 outline only           corner creasing, spring     corner folded down,
                        paused, still resolving      overshoot settled

click ───────────────▶ (fold begins, top-right) ──▶ (spring settles) = SAVED
SAVED ─── click ─────▶ (corner unfolds, reverse) ──▶ back to UNSAVED
```

## Seed-derived decisions

Seed: `Rwg+kx180JrXqtDnjBy3kni35SapUtgq`

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | motion primitive | 0 liquid fill-sweep · 1 ink-stamp press · 2 origami corner-fold · 3 elastic scale pop · 4 particle burst | `Rwg+` | 2 | **origami corner-fold** |
| 2 | feedback modality | 0 purely visual · 1 visual + haptic pulse · 2 visual + audio tick · 3 visual + numeric label | `kx18` | 0 | **purely visual** |
| 3 | saved-state cue (at rest) | 0 solid icon fill · 1 accent dot badge · 2 inverted bg chip · 3 ribbon tail extends · 4 persistent dog-ear fold | `0JrX` | 4 | **persistent dog-ear fold** |
| 4 | spatial anchor (motion origin) | 0 icon center · 1 bottom edge · 2 top notch · 3 top-right corner | `qtDn` | 3 | **top-right corner** |
| 5 | un-save reverse feedback | 0 exact reverse unfold · 1 dissolve/fade out · 2 shake-off wobble · 3 peel-away | `jBy3` | 0 | **exact reverse unfold** |
| 6 | pending-state representation | 0 spinner ring · 1 dimmed/disabled · 2 pulsing outline · 3 mid-fold hold · 4 skeleton shimmer | `kni3` | 3 | **mid-fold hold** |
| 7 | timing/easing character | 0 linear mechanical · 1 spring/overshoot · 2 ease-out decelerate · 3 snap-then-settle | `5Sap` | 1 | **spring/overshoot** |

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "Rwg+kx180JrXqtDnjBy3kni35SapUtgq" 5 4 5 4 4 5 4
```
Output:
```
[2, 0, 4, 3, 0, 3, 1]
```

## Why this diverges

- **From the default solution:** the default Save button flips its color/fill
  the instant you click. Here nothing swaps instantly — saving is a physical
  paper fold with spring settle, and the persistent saved marker is a folded
  corner (dog-ear), not a recolored icon.
- **From the assigned-axis baseline (motion language):** the obvious non-default
  motion is a bounce/scale pop or a bottom-up liquid fill. The seed landed on an
  origami corner-fold anchored at the top-right, with the pending window frozen
  as a half-completed crease — a motion primitive that doubles as both the
  transition and the resting state cue, which neither baseline does.
