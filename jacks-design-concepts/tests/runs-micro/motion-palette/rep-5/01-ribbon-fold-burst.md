# Ribbon Fold Burst

## Core idea
A hollow bookmark's SVG outline *folds* along its center crease into a solid ribbon (a path-morph, not a fade), spitting a short burst of paper-fleck particles at the fold moment; a small "Saved" chip springs out beside the button. The save is optimistic — the fold happens on click, before the network answers.

## Key visual + interaction principles
- **Palette (greenfield, invented):**
  - Surface / toolbar: `#12161C` (ink slate)
  - Idle icon stroke: `#8A94A6` (cool graphite)
  - Saved fill + chip: `#F5B841` (marigold ribbon)
  - Particle flecks: `#F5B841` + `#FCE3A6` (pale gold)
  - Error rollback tint: `#E0574B` (clay red)
- **Motion primitive = morph.** The bookmark is one SVG `<path>`. On click its `d` attribute interpolates from *outline pennant* to *creased solid ribbon*: the two lower legs swing inward and meet, as if the paper folds shut. ~220ms, `cubic-bezier(.34,1.3,.64,1)` so the fold overshoots and settles. No opacity/color crossfade drives the state change — the silhouette itself carries it.
- **State cue = icon silhouette.** Hollow stroke = unsaved; folded solid marigold = saved. The shape difference is the primary signal; color rides along but is not required to read the state (works for the color-blind).
- **Feedback modality = particle burst.** At the fold's midpoint, 6–8 tiny gold flecks eject upward-outward with gravity and fade over ~400ms. Purely decorative confirmation; respects `prefers-reduced-motion` by dropping the particles and the overshoot (straight 120ms morph only).
- **Spatial anchor = detached floating chip.** A pill reading "Saved" springs out to the right of the button (translateX + scale from the button's edge), holds ~1.2s, retracts. It is a separate element, not a tooltip tail — it does not obscure the icon and never blocks the re-click target.
- **Pending = optimistic instant.** Fold + burst + chip fire immediately on click. The request runs in the background. On failure the ribbon *un-folds* back to outline, the chip flips to a clay-red "Couldn't save — retry", and the item is not saved. No spinner, no pending greyout: the common (success) path feels instant.
- **Un-save = re-click toggle.** Clicking the solid ribbon reverses the morph (unfolds to outline), no particles on the way out, chip reads "Removed". Same target, same gesture — discoverable, no hidden long-press or hover-X.
- **Accessibility:** `<button aria-pressed>` toggles true/false; `aria-live="polite"` region announces "Saved" / "Removed" / "Couldn't save". Hit target ≥ 40px even though the glyph is 20px.

## ASCII wireframe

```
Toolbar
┌────────────────────────────────────────────────┐
│  [↩]  [✎]  [ ⚑ ]  [⤴]  [⋯]                       │
└─────────────┬──────────────────────────────────┘
              │  the Save button (bookmark glyph)

STATE: idle (unsaved)          STATE: mid-morph (~110ms)
   ┌───────┐                      ┌───────┐   . ˙ .   ← fleck burst
   │  ⌂    │  hollow outline      │  ◹◸   │  ·  ˙  ·
   │ /\    │  stroke #8A94A6      │  ▚▞   │   ˙  .
   │ \/    │                      │ folding legs
   └───────┘                      └───────┘

STATE: saved (settled)         STATE: save failed (rollback)
   ┌───────┐  ╭──────────╮         ┌───────┐  ╭───────────────────╮
   │  ▛▜   │  │  Saved ✓ │         │  ⌂    │  │ Couldn't save · ↻ │
   │  ▐█▌  │  ╰──────────╯         │ /\    │  ╰───────────────────╯
   │  ▝▘   │   ^ floating chip     │ \/    │   ^ clay-red chip
   └───────┘     springs out       └───────┘     (icon un-folded)
   solid marigold #F5B841

Re-click the solid ribbon → morph reverses → outline → chip "Removed"
```

## Seed-derived decisions

Seed: `IjUShRigac3qDBbnerFrP8AcGPS5/g95`

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|-------------------|--------|
| 1 | Motion primitive | 0 transform-scale/pop · 1 physics-spring bounce · 2 path-morph (fold) · 3 clip-reveal wipe · 4 3D flip | `IjUS` (0–3) | 342 % 5 = 2 | **2 path-morph (fold)** |
| 2 | Feedback modality | 0 pure-visual · 1 haptic-sim shake · 2 audio tick · 3 ripple emanation · 4 particle burst | `hRig` (4–7) | 419 % 5 = 4 | **4 particle burst** |
| 3 | State cue | 0 icon silhouette (hollow→solid) · 1 badge dot · 2 text-label swap · 3 color-only | `ac3q` (8–11) | 408 % 4 = 0 | **0 icon silhouette** |
| 4 | Spatial anchor | 0 in-place · 1 tooltip pop-above · 2 detached floating chip beside · 3 toolbar underline marker | `DBbn` (12–15) | 342 % 4 = 2 | **2 detached floating chip** |
| 5 | Pending representation | 0 spinner · 1 skeleton pulse · 2 progressive radial fill · 3 optimistic instant | `erFr` (16–19) | 431 % 4 = 3 | **3 optimistic instant** |
| 6 | Un-save affordance | 0 re-click toggle · 1 long-press · 2 hover-reveal X · 3 swipe | `P8Ac` (20–23) | 288 % 4 = 0 | **0 re-click toggle** |

Command run:

```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "IjUShRigac3qDBbnerFrP8AcGPS5/g95" 5 5 4 4 4 4
```

Output:

```
[2, 4, 0, 2, 3, 0]
```

## Why this diverges

**From the default solution.** The obvious Save button crossfades a hollow icon to a filled one via an opacity/color tween, shows a tooltip, and greys out with a spinner while the request is in flight. This concept refuses all three: the state change is carried by a *silhouette morph* (the shape physically folds), there is no pending spinner at all (optimistic instant with an explicit un-fold rollback), and confirmation is a spatially detached chip plus a particle burst rather than a tooltip tail.

**From the assigned-axis baseline.** The axis said "diverge from opacity/color tween — e.g. transform, spring, morph, clip-reveal." The cheap way to satisfy that is a `transform: scale()` pop (option 0), which is really just a tween on a different property. The seed landed on option 2, a genuine **path morph**: interpolating the SVG `d` so the outline folds into a solid ribbon. The state is legible from the frozen silhouette alone, not from where it sits in an animation curve — a categorically different primitive than scaling or fading the same glyph.
