# Ink Stamp Seal

## Core idea
The Save button is a rubber approval stamp: a click presses it down and it 3D-folds face-first onto the item to leave an ink seal, then a tiny wax-seal token flips off toward the corner tray where saved items collect. Un-saving reverses the whole press, lifting the stamp and peeling the seal back into the button.

## Key visual + interaction principles
- Palette (invented, greenfield):
  - Ink Indigo `#3B2E7E` — the stamp head at rest / saved fill
  - Vellum `#F4EFE4` — button plate background
  - Wax Vermilion `#D64533` — the seal token that travels + the "saved" accent
  - Graphite `#4A4A4A` — outline/unsaved neutral
  - Pending Slate `#8A8FA3` — spinner ring while the save is in flight
- Metaphor is a **stamp + wax seal**, not a bookmark. Unsaved = raised, inked stamp head hovering above a blank plate. Saved = a pressed vermilion seal impression sitting on the plate.
- **Motion primitive: 3D fold/rotate.** On click the stamp head rotates forward on its top edge (rotateX, ~90deg) so its inked face slaps down flat onto the plate — an origami-style face-plant rather than a scale or morph. On release it folds back up.
- **Pending cue: indeterminate spinner ring** traces the button's circular border in Pending Slate while the persistence request is outstanding. The stamp stays pressed-down (committed feel) but the ring says "not yet durable." Ring resolves to a solid vermilion border on success.
- **Feedback modality: micro-sound + color.** A short, dry "ka-chunk" stamp thud (~90ms, gained low, respects prefers-reduced-motion / muted state) fires exactly on the fold-down contact frame, synchronized with the plate flashing from Vellum to a brief Wax Vermilion bloom that settles into the saved accent.
- **Spatial anchor: travels to a target corner.** After the seal lands, a small vermilion wax-seal token detaches and arcs to the top-right saved-items tray corner, teaching where the item now lives. The token is decorative confirmation; the button itself is already in saved state.
- **Un-save: reverse the same animation.** Clicking a saved button plays the sequence backwards — spinner ring runs counter, stamp unfolds up off the plate, the seal desaturates from vermilion back to the graphite outline, and a higher, lighter "un-stick" tick sound plays. No separate X, no long-press, no hover peel.
- Responsiveness: the fold-down + color flash are optimistic and fire on click within one frame; the spinner ring covers network latency; failure re-folds the stamp up and flashes the border graphite (revert), never leaving a false "saved."
- Accessibility: `aria-pressed` toggles; sound is supplementary only; reduced-motion swaps the 3D fold for an instant plate color change + static ring; focus ring is a 2px Ink Indigo halo.

## ASCII wireframe

```
UNSAVED (rest)              CLICK / PENDING              SAVED (settled)
                            (spinner ring tracing)
   __________                  .-''''''-.                 __________
  /  ______  \                /  ~ring~  \               / ▓▓▓▓▓▓▓▓ \
 |  |░STAMP░| |   click →     | [pressed] |   ok →       | ▓ SEAL ▓ |
 |  |  ░░░  | |   ka-chunk    |  folding  |  border      | ▓ (wax) ▓ |
  \  ‾‾‾‾‾‾  /   + flash       \  down   /   solid       \ ▓▓▓▓▓▓▓▓ /
   ‾‾‾‾‾‾‾‾‾‾                   '-......-'                 ‾‾‾‾‾‾‾‾‾‾
  raised inked                spinner = not-yet          pressed seal
  stamp, graphite             durable; slate ring        in wax vermilion
                                                              \
                                                               \   seal token
   fold sequence (side view):                                   \  arcs away
      ▐▔▔▌   ▐▔▔╱   ▐▔╱     ▂▂▂                                   ◍ → → → ┐
      ▐  ▌ → ▐ ╱  → ▐╱   → (flat on plate)                                v
      raised   rotateX 90deg   contact                          [ saved tray ]
                                                                  top-right corner
```

## Seed-derived decisions

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Metaphor (replaces filled/outline bookmark) | 0 pocket/slot drop · 1 thread/pin stitch · 2 dog-ear page fold · 3 magnet snap · 4 ribbon unfurl · 5 ink stamp press | `A4kW` | 5 | **ink stamp press** |
| 2 | Motion primitive | 0 path morph/tween · 1 spring overshoot bounce · 2 3D fold/origami rotate · 3 liquid fill sweep · 4 particle burst | `nDFm` | 2 | **3D fold/rotate** |
| 3 | Feedback modality (beyond core visual) | 0 color shift only · 1 haptic + color · 2 micro-sound + color · 3 ripple/glow halo + color | `lGc0` | 2 | **micro-sound + color** |
| 4 | Pending-state cue | 0 indeterminate spinner ring · 1 progress arc completes · 2 pulsing dim · 3 skeleton shimmer | `VsnY` | 0 | **indeterminate spinner ring** |
| 5 | Spatial anchor | 0 button center · 1 cursor click point · 2 toolbar edge · 3 travels to target corner | `g1+T` | 3 | **travels to target corner** |
| 6 | Un-save affordance | 0 reverse same animation · 1 long-press release · 2 second-click peel/eject · 3 hover X overlay · 4 swipe-off | `F0Oq` | 0 | **reverse same animation** |

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "A4kWnDFmlGc0VsnYg1+TF0Oqi3lUFE5p" 6 5 4 4 4 5
```
Output:
```
[5, 2, 2, 0, 3, 0]
```

## Why this diverges

- **From the default solution:** the standard Save micro-interaction is an outline bookmark that fills in on click with a color/scale pop. This uses no bookmark at all — a rubber stamp physically presses a wax seal onto the item, driven by a 3D fold rather than a fill or scale, and confirmed with a synchronized stamp thud sound plus a seal token that flies to the tray.
- **From the assigned-axis baseline (Metaphor):** the axis only mandated leaving filled-vs-outline behind. Nearer-to-default metaphor picks (pocket/slot, magnet, dog-ear) still lean on "container" imagery; the seeded index landed on the ink-stamp/approval metaphor, which reframes saving as *authorizing/sealing* an item rather than *filing* it — a distinct mental model, and one that naturally justifies the fold-down motion, the ka-chunk audio, and the traveling wax seal.
