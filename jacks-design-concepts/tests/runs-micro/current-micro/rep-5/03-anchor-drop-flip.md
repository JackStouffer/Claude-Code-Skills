# Anchor Drop Flip

## Core idea
Saving "moors" the item: the square button flips like a card on its vertical
axis, its front face (an open mooring hook) rotating away to reveal the back
face (a seated, dropped anchor). Un-saving hauls the anchor back up with a
distinct reverse-eject motion.

## Key visual + interaction principles
- **Metaphor is mooring, not bookmarking.** No bookmark ribbon anywhere. The
  saved state reads as "this item is anchored / held in place," which maps
  cleanly onto "kept safe in my list."
- **Two-faced card.** The button is a rounded square tile with two faces:
  - Front (unsaved): a thin open hook / cleat outline.
  - Back (saved): a solid dropped anchor, flukes down, with a taut rode line.
- **Flip is the whole feedback.** A single ~260ms 3D rotation about the
  vertical axis (`rotateY`) swaps faces. Halfway through, the edge catches a
  light sheen so the flip reads as a physical object turning, not a crossfade.
- **Pending = breathe.** While the save request is in flight the tile does a
  low-amplitude scale pulse (breathe, 0.97–1.03, ~900ms loop). It does not
  commit the flip until the server confirms; if it fails, the breathe stops
  and the tile settles back to the front face with a short shake.
- **Corner badge as the persistent state marker.** A small dot badge sits at
  the top-right corner of the tile: hollow ring when unsaved, filled when
  saved. This gives an at-rest, no-motion-required cue (accessibility: state
  is not conveyed by the flip alone).
- **Text ripple as the confirming modality.** On confirmed save a tiny label
  ("Moored") ripples outward from the tile — letters fade+rise in sequence
  left to right over ~200ms, then fade. No sound, no haptic dependency; the
  ripple is the human-readable receipt for the flip.
- **Un-save is a distinct eject.** A second click does NOT simply play the
  flip in reverse at the same feel. The anchor "hauls up": the back face lifts
  ~6px and the tile flips back with a snappier, shorter curve (ease-in rather
  than the ease-out used for dropping), and the ripple label reads "Cast off".
  The asymmetry makes save vs un-save feel like two different physical acts.
- **Responsiveness.** The flip starts on `pointerdown` (optimistic), the
  breathe covers latency, and the corner badge is the source of truth that
  reconciles with the server response.

## ASCII wireframe

```
  UNSAVED (front face)          PENDING (breathe)           SAVED (back face)
  ┌───────────┐ ◌ badge         ┌───────────┐ ◌            ┌───────────┐ ● badge
  │   __       │  (hollow)       │  ~ ~ ~ ~  │  scale       │    │      │  (filled)
  │  /  \      │                 │ ( tile    )  pulse       │   /│\     │
  │  \__/      │  open hook      │  breathes )              │  / │ \    │  dropped
  │   ||       │                 │ ~ ~ ~ ~ ~ │              │ ‾‾‾╨‾‾‾   │  anchor
  └───────────┘                  └───────────┘              └───────────┘

           click ─▶  [ rotateY 260ms, ease-out ]  ─▶  ripple: "M o o r e d"

  UN-SAVE (second click):  back face lifts 6px, rotateY back 180ms ease-in
           └▶ ripple: "C a s t   o f f",  badge ◌ hollow again

  Flip midpoint (edge sheen):   ┌─┐│    ← tile seen edge-on, thin highlight
```

Palette (greenfield, invented):
- Tile face: deep harbor navy `#12283A`
- Hook / anchor stroke (unsaved): muted slate `#6E8BA6`
- Anchor fill + rode (saved): brass/rope amber `#E0A54B`
- Badge filled: same amber `#E0A54B`; hollow ring: `#6E8BA6`
- Ripple label text: pale seafoam `#CFE3DC`
- Fail shake tint: coral `#D9605A`

## Seed-derived decisions

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Saved-state metaphor | 0 pocket swallows item · 1 pin/thread stitches down · 2 magnet snap · 3 jar/vault seals lid · 4 anchor drops/moors · 5 dog-ear page fold | `RvS9` | 4 | **anchor drops / moors** |
| 2 | Motion primitive | 0 glyph path-morph · 1 spring overshoot · 2 3D fold/card-flip rotation · 3 particle burst · 4 liquid fill/drain | `Df3G` | 2 | **3D fold / card-flip rotation** |
| 3 | Confirming feedback modality | 0 haptic+visual · 1 color-shift only · 2 soft sound+visual · 3 text/label ripple | `aaWz` | 3 | **text/label ripple** |
| 4 | Pending / in-flight cue | 0 progress ring · 1 breathe/pulse scale · 2 ghost/skeleton glyph · 3 shimmer sweep · 4 dot trail | `kCLj` | 1 | **breathe / pulse scale** |
| 5 | Spatial anchor of the state cue | 0 centered in button · 1 emanate toward off-button target · 2 corner badge on button · 3 trailing toast beside button | `vz7G` | 2 | **corner badge on button** |
| 6 | Un-save affordance | 0 same reverse animation toggle · 1 long-press to unsave · 2 hover reveals "x" undo · 3 second click distinct eject | `RzXo` | 3 | **second click, distinct eject** |

Command run:

```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "RvS9Df3GaaWzkCLjvz7GRzXoWI4Sfp/q" 6 5 4 5 4 4
```

Output:

```
[4, 2, 3, 1, 2, 3]
```

## Why this diverges

**From the default solution.** The obvious Save micro-interaction is a
bookmark glyph that toggles outline↔filled, often with a spring pop and maybe
a color change. This concept has no bookmark shape at all, no fill toggle, and
its motion primitive is a physical card-flip rather than a color/opacity
swap — the button is a two-faced object that turns over.

**From the assigned-axis baseline (metaphor).** The axis demands leaving the
filled-vs-outline bookmark behind. The seed landed on a *mooring / anchor*
metaphor: saving means the item is held in place, un-saving means casting off.
This reframes "save" from "mark a page" to "secure an object," and the whole
interaction (drop vs haul-up asymmetry, taut rode line, corner badge as the
mooring indicator) is built to sell that mooring story rather than a
librarian's bookmark.
