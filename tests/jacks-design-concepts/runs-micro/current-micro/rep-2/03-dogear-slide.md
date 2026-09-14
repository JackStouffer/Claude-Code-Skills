# Concept 03: Dog-Ear Slide

## Core idea
Saving folds down the top-right corner of the button's little "page" — a dog-ear
flap that slides diagonally into place — instead of toggling a bookmark shape;
un-saving slides the same flap back out.

## Key visual + interaction principles
- The button face IS a small sheet of paper (rounded rect). No bookmark ribbon
  anywhere — the save metaphor is dog-earing a page corner.
- Click drives a triangular corner flap that TRANSLATES diagonally from off-corner
  into the top-right, coming to rest as a folded dog-ear (with a subtle shadow
  crease). Slide, not rotate — the flap glides in on a straight diagonal vector.
- Motion is pure translate/opacity so it stays cheap and interruptible.
- Everything happens IN PLACE at the button; nothing flies to a collection or
  travels across the toolbar.
- Feedback pairs a color shift with a short audio tick (a soft paper "tk") the
  moment the flap seats. Respects `prefers-reduced-motion` (flap appears without
  the slide) and audio is muted if the user has UI sounds off.
- Pending (awaiting server confirm) reads as a skeleton shimmer sweeping across
  the sheet — the paper looks "not-yet-inked."
- Saved rests with a soft glow halo around the whole button so a saved item is
  legible at a glance without re-reading the corner.
- Second click = eject: the flap slides back out along the reverse diagonal, glow
  fades, tick pitched down. Same button, opposite motion — no separate remove X,
  no long-press.

### Palette (invented, greenfield)
- Sheet (idle): `#F4F1EA` warm paper
- Ink / icon lines: `#2E3138`
- Flap fold + saved accent: `#C7502F` terracotta
- Glow halo (saved): `#C7502F` at 18% alpha, 8px blur
- Shimmer band (pending): `#FFFFFF` at 40% over sheet

## States
| state | face | corner | extra |
|-------|------|--------|-------|
| idle | warm paper | square, flat | — |
| pending | paper + shimmer sweep | flap mid-slide | no tick yet |
| saved | paper | terracotta dog-ear seated | glow halo + tick |
| ejecting | paper | flap slides back out | halo fades, low tick |

## ASCII wireframe
```
   IDLE                 PENDING (shimmer)        SAVED
  ┌──────────┐         ┌──────────┐            ┌──────────┐◜glow◝
  │          │         │░░▒▒▓▓░░  │            │        ◣ │  ← flap
  │          │         │  ░░▒▒▓▓  │  flap →     │       ╱▚ │    seated
  │          │         │ ▒▓  ░░   │  sliding    │          │
  └──────────┘         └──────────┘            └──────────┘◟glow◞
      click ──▶            shimmer                 tk!  (terracotta)

  SAVED ──click──▶  EJECTING: flap slides back out along reverse
                    diagonal, halo fades, low "tk", returns to IDLE
```

## Seed-derived decisions
Seed: `7/gUzku1KsCKhOjw73U9hCSUlQcdck+t`

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Metaphor (core icon) | 0 drop-into-pocket / 1 thread-pin stitch / 2 dog-ear page fold / 3 anchor latch / 4 magnet snap / 5 ribbon roll-down | `7/gU` | 2 | dog-ear page fold |
| 2 | Motion primitive | 0 morph path-tween / 1 spring overshoot / 2 3D fold-rotate / 3 draw-on stroke / 4 particle burst / 5 slide/translate | `zku1` | 5 | slide/translate |
| 3 | Feedback modality | 0 color only / 1 color+pulse ring / 2 color+audio tick / 3 color+micro-label / 4 color+fill sweep | `KsCK` | 2 | color + audio tick |
| 4 | Pending-state cue | 0 spinner ring / 1 progress fill / 2 pulsing ghost / 3 skeleton shimmer / 4 dot trail | `HOjw` | 3 | skeleton shimmer |
| 5 | Saved resting cue | 0 fill+accent dot / 1 base bar / 2 badge count / 3 glow halo / 4 corner check | `73U9` | 3 | glow halo |
| 6 | Spatial anchor | 0 center-out / 1 from cursor point / 2 baseline-up / 3 fly-to corner / 4 in place | `hCSU` | 4 | in place |
| 7 | Un-save interaction | 0 rewind same click / 1 long-press / 2 undo affordance / 3 second-click eject (opposite motion) / 4 hover reveal X | `lQcd` | 3 | second-click eject |

Command:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "7/gUzku1KsCKhOjw73U9hCSUlQcdck+t" 6 6 5 5 5 5 5
```
Output:
```
[2, 5, 2, 3, 3, 4, 3]
```

## Why this diverges
- **From the default solution:** the default Save micro-interaction is a bookmark
  glyph that fills in on click. There is no bookmark shape here at all — the
  button is a sheet of paper and saving dog-ears its corner. Feedback also leaves
  the purely-visual lane with a paper "tk" audio tick.
- **From the assigned-axis baseline (Metaphor):** the axis says diverge from
  filled-vs-outline bookmark. Dog-earing a page is a physical "I'll come back to
  this" gesture that predates the digital bookmark icon entirely, so the save
  meaning is carried by folding a corner rather than by any bookmark form. The
  slide-in flap, skeleton-shimmer pending, glow-halo rest state, in-place anchor,
  and second-click eject all reinforce a page/paper world rather than a ribbon one.
