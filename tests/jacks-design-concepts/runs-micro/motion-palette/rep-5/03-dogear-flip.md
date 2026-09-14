# Concept: Dog-Ear Flip

**Core idea:** The Save button is a bookmark card that physically *flips* on
its vertical axis when clicked — hollow cool front turning to a solid warm
back — with a spring that overshoots the landing and settles, and a spark
burst thrown from the exact pixel you clicked.

## Palette (greenfield — invented)

| token | hex | use |
|-------|-----|-----|
| `--tb-surface` | `#FBFAF7` | warm paper-white toolbar |
| `--ic-idle` | `#7A8699` | cool slate — unsaved front face outline |
| `--ic-saved` | `#E8543E` | vermilion — saved back face fill (warm hue) |
| `--spark-a` | `#F4A93B` | amber spark |
| `--spark-b` | `#E8543E` | vermilion spark |
| `--focus` | `#2D6FE0` | focus ring |

State is read by **hue temperature**, not by hollow-vs-filled: cool slate =
unsaved, warm vermilion = saved. Both faces are fully drawn glyphs; the flip
is what swaps which hue you see.

## Key visual + interaction principles

- **One glyph, two faces.** Front face: slate open-outline bookmark. Back
  face: solid vermilion bookmark (mirror-flipped so it reads correctly after
  the turn). Implemented as a `rotateY` on a `preserve-3d` container.
- **Overshoot-settle timing (the axis).** A click drives `rotateY` 0deg -> 180deg
  but the button springs *past* to ~195deg, then settles back to 180deg. Not
  one ease — a two-phase spring: fast approach, elastic settle.
  Suggested: `transition` faked with a spring keyframe, or a WAAPI spring
  (`stiffness ~420, damping ~22`), ~320ms total, settle tail ~140ms of it.
- **Spark burst anchored to the click point.** On `pointerdown` capture
  `offsetX/offsetY`; at the flip's 50% crossover (~110ms) emit 6-8 spark
  dots from that coordinate, radiating out with their own decay ease. Sparks
  alternate `--spark-a` / `--spark-b`. Keyboard activation (Enter/Space)
  falls back to the glyph center as the origin.
- **Responsiveness.** Optimistic: the flip starts on `pointerdown`, not on
  the async save resolving. If the save request fails, flip snaps back and a
  1px vermilion underline flashes as the error tell.
- **Un-save = peel back.** A second click doesn't re-run the same forward
  flip; it *peels*: `rotateY` runs 180deg -> back toward 0deg but with the
  warm back face visibly draining to slate as it turns (hue crossfade tied to
  rotation angle), and no spark burst. The turn is the mirror of the save,
  so save and un-save never look identical.
- **Accessibility.** `aria-pressed` toggles; `prefers-reduced-motion` drops
  the flip + sparks and does a straight 120ms hue crossfade slate<->vermilion.
  44px min hit target, visible `--focus` ring.

## ASCII wireframe

```
  toolbar (#FBFAF7)
  ┌───────────────────────────────────────────┐
  │  ◱   ⤢   ⟳         [ SAVE ]        ⋯       │
  └────────────────────────┬────────────────────┘
                           │
        idle (unsaved)     │     mid-flip (~110ms)     settled (saved)
        rotateY 0deg       │     rotateY ~90deg         rotateY 180deg
                           │      + spark burst
         ┌───────┐         │        ·  *  ·             ┌───────┐
         │       │  slate  │      · ╱     ╲ ·           │███████│ vermilion
         │       │ outline │       ‖  edge  ‖ *         │███████│ solid
         │       │         │      · ╲     ╱ ·           │███████│
         │ ╲   ╱ │         │        ·  *  ·             │██╲ ╱██│
         └──╲ ╱──┘         │    sparks fly from         └───╲╱──┘
             V             │    the click pixel  ·           V
                           │
   overshoot detail:  0 ───fast──▶ 180 ──past─▶ 195 ◀settle─ 180
                                              (elastic tail)

   second click = PEEL:  180 ──▶ 0 , warm face draining to slate,
                         no sparks (mirror of save, not a repeat)
```

## Seed-derived decisions

Seed: `QyM/oT0IME13kcByTIqVEnFcy57sEmHb`

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 0 | Timing structure (assigned axis) | 0 staged sequence · 1 overshoot-settle · 2 interruptible-reversible spring · 3 elastic anticipation wind-up · 4 ripple-delay cascade | `QyM/` | 1 | **overshoot-settle** |
| 1 | Motion primitive (what moves) | 0 outline morph-to-fill · 1 fold/flip · 2 scale pop · 3 stroke path-draw · 4 slide-swap two glyphs | `oT0I` | 1 | **fold/flip** |
| 2 | Feedback modality | 0 color shift only · 1 particle/spark burst · 2 haptic+color · 3 audible tick · 4 fill-sweep gradient | `ME13` | 1 | **spark burst** |
| 3 | State cue (saved vs unsaved) | 0 fill solidity · 1 badge dot · 2 ribbon-length flag · 3 hue temperature · 4 stroke weight | `kcBy` | 3 | **hue temperature** |
| 4 | Spatial anchor (animation origin) | 0 icon center · 1 click point · 2 bookmark top notch · 3 bookmark bottom-V tips · 4 toolbar baseline | `TIqV` | 1 | **click point** |
| 5 | Un-save affordance (reverse) | 0 same forward flip toggles · 1 long-press · 2 hover-reveal X · 3 second-click peel-back · 4 rewind of particles | `EnFc` | 3 | **peel-back** |

Command run:

```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "QyM/oT0IME13kcByTIqVEnFcy57sEmHb" 5 5 5 5 5 5
```

Output:

```
[1, 1, 1, 3, 1, 3]
```

## Why this diverges

**From the default solution.** The obvious Save micro-interaction is a hollow
outline that fills with color under a single ease-out, maybe a small scale
pop — state read as hollow-vs-solid. This concept reads state by *hue
temperature* (cool->warm), moves by a *3D flip* instead of a fill, and fires
*sparks from the click pixel* rather than a centered pulse. None of the four
default reflexes survive.

**From the assigned-axis baseline (single-ease timing).** The seed fixed me to
overshoot-settle. A single ease-out flip would rotate 0->180deg and stop dead.
Here the flip springs *past* to ~195deg and settles back with an elastic tail,
and the reverse is a distinct mirror "peel" rather than a replay of the same
curve — so the timing signature itself carries the pending->saved->unsaved
story, which a single monotonic ease cannot.
