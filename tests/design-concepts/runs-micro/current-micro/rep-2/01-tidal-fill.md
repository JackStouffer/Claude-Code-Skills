# Concept 01 — Tidal Fill

**Core idea:** The bookmark saves by filling with color from the bottom up like
liquid rising into the glyph; a click un-saves by draining that fill back down —
never an instant color flip.

## Key visual + interaction principles

- **Motion primitive — liquid fill-sweep (DP1):** On click the bookmark outline
  is a container. A colored level rises from the bottom notch to the tip over
  ~320ms with a slight ease-out overshoot, so the fill "settles" like water. This
  is the whole save gesture — the outline never blinks solid.
- **Pending cue — clockwise progress ring (DP2):** While the save request is in
  flight, a thin ring traces clockwise around the button. The liquid fill is
  held at ~15% (a shallow puddle) until the request resolves, then completes the
  rise. If the request fails, the puddle drains and the ring flashes once.
- **Feedback modality — ephemeral tooltip label (DP3):** The moment the fill
  settles, a small "Saved" label fades in just above the button for ~1.2s then
  fades out. No sound, no separate toast — the label is the confirmation copy.
- **Spatial anchor — centered on the icon (DP4):** The fill, the ring, and the
  label all key off the icon's own center axis. Nothing radiates from the cursor
  or from a corner badge; the button is the sole locus.
- **Un-save affordance — tap collapses the fill downward (DP5):** Clicking a
  filled bookmark drains the liquid back down through the notch (~260ms, gravity
  ease-in) and the tooltip briefly reads "Removed". Same button, reversed motion.
- **Palette — duotone saved state (DP6):** Empty = single hairline ink stroke on
  transparent. Saved = two-tone: the rising liquid is a deep indigo (#3B3F9E)
  body under a lighter crest highlight (#8AA0FF) that tracks the top of the fill
  as it rises, giving the water a meniscus. Pending ring is the crest color at
  60% alpha.

## ASCII wireframe

```
   empty            pending            rising            saved (duotone)
   ┌──────┐         ┌──────┐          ┌──────┐          ┌──────┐
   │  ▁▁  │         │ ◜▁▁◝ │          │  ▁▁  │          │  ▁▁  │
   │ │  │ │         │ │  │ │ ring     │ │  │ │          │ │██│ │  crest #8AA0FF
   │ │  │ │  hair-  │ │░░│ │ tracing  │ │▓▓│ │ level    │ │▓▓│ │  body  #3B3F9E
   │ │  │ │  line   │ │▓▓│ │ + puddle │ │▓▓│ │ rising   │ │▓▓│ │
   │ └╲╱┘ │  ink    │ └╲╱┘ │ at ~15%  │ └╲╱┘ │ up       │ └╲╱┘ │
   └──────┘         └──────┘          └──────┘          └──────┘
                                                        ┌────────┐
                                                        │ Saved  │  tooltip
                                                        └───┬────┘  (1.2s fade)
                                                            ▼ centered above

   un-save: filled → liquid drains down through notch (260ms) → "Removed" label
```

## Seed-derived decisions

Seed: `OVWZQ/QqtijeG/lEvSdNyAz3LEnbnM4j`

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Motion primitive | 0 liquid fill-sweep · 1 origami fold-flip · 2 elastic squash-pop · 3 particle burst · 4 path draw-on stroke · 5 outline↔fill path morph | `OVWZ` | 0 | **0 liquid fill-sweep** |
| 2 | Pending-state cue | 0 indeterminate arc spinner · 1 pulsing opacity breathe · 2 clockwise progress ring · 3 dim + shimmer sweep · 4 marching-ants dashes | `Q/Qq` | 2 | **2 clockwise progress ring** |
| 3 | Feedback modality | 0 none/visual only · 1 haptic-style scale bounce · 2 audio tick · 3 ephemeral tooltip label · 4 color-only | `tije` | 3 | **3 ephemeral tooltip label** |
| 4 | Spatial anchor | 0 centered on icon · 1 bottom-notch anchored · 2 radiates from click point · 3 top badge dot · 4 baseline underline | `G/lE` | 0 | **0 centered on icon** |
| 5 | Un-save affordance | 0 toggle w/ reverse anim · 1 long-press · 2 hover X overlay · 3 second-click undo toast · 4 tap collapses fill downward | `vSdN` | 4 | **4 tap collapses fill downward** |
| 6 | Palette / state logic | 0 monochrome weight-only · 1 accent amber · 2 teal accent · 3 duotone two-tone · 4 warm coral | `yAz3` | 3 | **3 duotone two-tone** |

Command run:

```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "OVWZQ/QqtijeG/lEvSdNyAz3LEnbnM4j" 6 5 5 5 5 4
```

Output:

```
[0, 2, 3, 0, 4, 3]
```

## Why this diverges

- **From the default solution:** the default Save button does an instant color
  swap (outline → solid) on click. Tidal Fill replaces that with a timed liquid
  rise whose duration is coupled to the request lifecycle (puddle-while-pending,
  full-rise-on-success), so the motion itself carries the state instead of a
  binary color toggle.
- **From the assigned-axis baseline (Motion language):** the axis asks to leave
  the instant color swap behind. The seed committed motion to a *directional,
  physics-flavored fill* rather than the more obvious pop/scale bounce (DP1 index
  0 over the elastic-pop option at index 2), and made un-saving the literal
  reverse of that motion (DP5 index 4) — so the interaction reads as one
  reversible fluid gesture, not two separate states.
