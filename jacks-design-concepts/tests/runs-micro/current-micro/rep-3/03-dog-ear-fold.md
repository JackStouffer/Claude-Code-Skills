# Dog-Ear Fold

## Core idea
Saving an item folds down the top-right corner of the button like dog-earing a
page you want to return to; the fold morphs open on save and creases flat on
un-save, so the metaphor is "marking your place" rather than dropping a pin in.

## Key visual + interaction principles
- Palette (invented, greenfield): parchment `#F4EFE4` button face, ink
  `#2B2A26` glyph, kept-accent `#C8622B` (burnt-sienna fold underside),
  confirm-green `#3E7C58` checkmark. Warm paper tones, one saturated accent for
  the fold's inner face so the crease reads as a real turned corner.
- The button is a small squared card (the "page"). The save affordance is the
  top-right corner. Idle = flat corner. Saved = corner turned down, revealing
  the sienna triangle underside plus a green check tucked into the fold.
- Motion is a **morph/path-tween**: the corner's SVG path animates from a
  square vertex to a folded triangle (the diagonal crease line draws in as the
  triangle flips). No bounce, no particles — one continuous crease that folds
  and unfolds. ~180ms fold, ~140ms unfold, ease-out.
- Feedback is a **micro-text label**: a tiny word ("Saving..." then "Kept")
  slides out under the button from the top edge during the interaction, then
  fades. This carries the meaning for anyone who can't parse the fold quickly
  and is the accessible live-region text.
- The fold's origin is the **top edge**: the crease grows downward from the top
  corner, and the micro-label is anchored to that same top edge so eye stays in
  one place.
- **Pending**: on click the fold starts but the sienna underside renders as a
  low-contrast **shimmer** (animated gradient sweep) until the server confirms;
  on confirm the shimmer resolves to solid sienna + green check. If the save
  fails, the fold un-creases and the label reads "Not kept".
- **Un-save**: hovering a saved (folded) button reveals a small **X overlay**
  on the fold; clicking it (or the button) un-creases the corner back to flat.
- Persistent **saved-state cue** is the folded corner *plus a checkmark
  overlay* tucked in the triangle, so state is legible even when motion is off
  (`prefers-reduced-motion` snaps between flat and folded with no tween).
- Accessibility: `<button role>` with `aria-pressed`, label text mirrored to an
  `aria-live="polite"` region ("Saving", "Kept", "Removed", "Not kept"),
  44px min target, focus ring on the whole card.

## ASCII wireframe

```
IDLE (flat corner)          PENDING (folding, shimmer)     SAVED (folded + check)
┌───────────┐               ┌────────┐╱                   ┌────────┐╲
│           │               │        │░  <- shimmer        │        │▓╲   ▓ = sienna
│     ◻     │               │     ◻  │░     underside      │     ◻  │▓✓╲  ✓ = green
│           │               │        │                     │        │▓▓╲
└───────────┘               └────────┘                     └────────┘
                              ┌─────────┐                    (hover)
                              │Saving...│  <- top-edge      ┌────────┐╲
                              └─────────┘     micro-label   │      ✕ │▓╲   ✕ = un-save
                                                            │     ◻  │▓✓╲     overlay
                                            ┌────┐          │        │▓▓╲
                                            │Kept│          └────────┘
                                            └────┘
```

## Seed-derived decisions

Command run:

```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "uRfFN5hQkoBmOhLnvIQvZJNHQfbean3z" 6 5 5 5 4 4 3
```

Output:

```
[5, 1, 3, 4, 2, 2, 1]
```

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|---|---|---|---|---|
| 1 | Metaphor (assigned axis, DP0) | 0 drop-into-pocket/slot · 1 pin-into-corkboard · 2 tag/label folds over · 3 jar fills with liquid · 4 magnet snaps item · 5 dog-ear folded page corner | `uRfF` | 5 | **5 dog-ear folded page corner** |
| 2 | Motion primitive | 0 spring overshoot bounce · 1 morph/path-tween · 2 slide/translate · 3 rotate/flip · 4 particle burst | `N5hQ` | 1 | **1 morph/path-tween** |
| 3 | Feedback modality | 0 color fill sweep · 1 haptic + sound · 2 radiating ripple ring · 3 micro-text label · 4 progress arc | `koBm` | 3 | **3 micro-text label** |
| 4 | Persistent saved-state cue | 0 filled badge dot · 1 depressed/inset button · 2 accent underline bar · 3 glow/aura halo · 4 checkmark overlay | `OhLn` | 4 | **4 checkmark overlay** |
| 5 | Spatial anchor | 0 from click point · 1 from button center · 2 from top edge · 3 from bottom edge | `vIQv` | 2 | **2 from top edge** |
| 6 | Un-save affordance | 0 second click reverses same anim · 1 long-press to remove · 2 hover reveals X overlay · 3 second click distinct eject anim | `ZJNH` | 2 | **2 hover reveals X overlay** |
| 7 | Pending-state treatment | 0 optimistic instant, silent reconcile · 1 pending shimmer until server confirms · 2 disabled + spinner | `Qfbe` | 1 | **1 pending shimmer until confirm** |

Seed segment check: chars `[4i, 4i+4)` of `uRfFN5hQkoBmOhLnvIQvZJNHQfbean3z` →
`uRfF` `N5hQ` `koBm` `OhLn` `vIQv` `ZJNH` `Qfbe` (`an3z` unused, only 7 DPs).

## Why this diverges
- **From the default solution:** the default Save micro-interaction is a
  bookmark ribbon or heart that toggles filled/outline with a scale-pop. This
  concept has no bookmark glyph at all — the button *is* a page, and saving
  physically folds its corner. Confirmation is a morphing crease + a word, not
  a color-swap of a fixed icon.
- **From the assigned-axis baseline (filled-vs-outline bookmark):** the metaphor
  is "dog-ear the page to keep your place," a paper-folding gesture. State is
  carried by geometry (a turned corner with a real underside) rather than by
  filling an existing outline, and the animation tweens the fold path instead of
  cross-fading two static icons.
