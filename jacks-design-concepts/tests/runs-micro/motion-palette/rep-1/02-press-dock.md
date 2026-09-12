# Concept 02 — Press-Dock

## Core idea
The Save button behaves like a physical key that you press *into* the toolbar: a
click squishes it, it holds compressed while the save is pending, then springs
down and settles flush into a recessed "dock" well to read as saved — un-saving
peels the filled bookmark off the top like lifting a sticker, and the key rises
back up.

## Key visual + interaction principles
- **Feedback is spatial, not a color wash.** The primary "it worked" signal is
  depth: the button loses elevation and sits recessed in a shadowed well. You
  read state by where the button *is* in Z, not by whether it is tinted.
- **Motion primitive: scale-pop spring.** The settle uses a slight overshoot
  spring (compress past rest, then relax) so the dock feels like a real key
  seating, never a linear tween.
- **Pending is a held compression.** On press the button squishes to ~88% height
  and *stays* there until the save resolves; the hold itself is the spinner.
  Optimistic UI: if the round-trip is <120ms it goes straight to docked.
- **Saved state cue: filled glyph.** Once docked, the outline bookmark becomes a
  solid glyph. Depth carries the load; fill is the quiet confirmation.
- **Anchor: button center.** All displacement radiates from the button's own
  footprint — it does not slide toward an edge or a shelf.
- **Un-save = peel-away.** Clicking a docked button peels the filled glyph up
  from its top corner (a lift + fade), and the key rises back to flush/elevated
  resting state with the hollow outline.
- **Palette (invented, greenfield):**
  - Rest surface `#F4F1EA` (warm paper), key face `#FFFFFF`
  - Ink / glyph outline `#2B2A26`
  - Filled/saved glyph `#3E6F4E` (fern green)
  - Well shadow (recess) `rgba(43,42,38,0.28)`
  - Focus ring `#3E6F4E` at 2px
- **Timings:** press-squish 80ms ease-out · pending hold (variable) · dock spring
  260ms cubic-bezier(0.34,1.56,0.64,1) overshoot · peel-away 200ms.
- **A11y:** `aria-pressed` toggles true/saved; `prefers-reduced-motion` drops the
  squish/spring and just swaps outline→filled glyph with a static inset shadow.
  Non-color depth cue plus glyph fill means state is legible without color
  perception.

## ASCII wireframe

```
RESTING (unsaved) — key sits proud of the toolbar
   ┌───────────────┐
   │   ▛▜  outline  │   elevated, drop shadow below
   │   ▙▟  bookmark │
   └───────────────┘
        ▁▁▁▁▁          <- shadow (raised)

PRESS + PENDING — compressed and held
   ┌───────────────┐
   │▂▂▂▂▂▂▂▂▂▂▂▂▂▂▂│   squished to ~88%, no shadow,
   │   ▛▜  outline  │   HELD here until save resolves
   └───────────────┘

SAVED — docked into a recessed well, glyph filled
  ╔═══════════════╗    inner shadow (inset), sits low
  ║   ██  filled   ║
  ║   ██  bookmark ║   fern-green solid glyph
  ╚═══════════════╝

UN-SAVE — filled glyph peels off the top, key rises
   ┌───────────────┐        ◹  (glyph lifting + fading)
   │   ▛▜           │
   │   ▙▟  outline  │   springs back up to RESTING
   └───────────────┘
```

## Seed-derived decisions

Seed: `mZFIPVb/eeNVTDTtyN3OrkyTZ6vLUxYS`

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | motion primitive | 0 scale-pop spring · 1 flip/rotate · 2 path morph · 3 slide/displace · 4 elastic wobble · 5 ink/liquid fill | `mZFI` | 0 | **scale-pop spring** |
| 2 | feedback modality (assigned axis) | 0 visual color-fill · 1 spatial displacement (recess) · 2 faux-haptic micro-bounce · 3 audio tick · 4 shape-change dogear | `PVb/` | 1 | **spatial displacement** |
| 3 | saved state cue | 0 filled glyph · 1 corner ribbon fold · 2 badge dot · 3 color inversion · 4 outline weight change · 5 notch/dogear | `eeNV` | 0 | **filled glyph** |
| 4 | spatial anchor | 0 button center · 1 bottom edge/shelf · 2 top edge/pin · 3 icon tip | `TDTt` | 0 | **button center** |
| 5 | pending indicator | 0 optimistic/none · 1 ring sweep · 2 dot pulse · 3 shimmer · 4 squish-and-hold | `yN3O` | 4 | **squish-and-hold** |
| 6 | un-save affordance | 0 reverse animation · 1 shake-off/eject · 2 peel-away · 3 fade-drop | `rkyT` | 2 | **peel-away** |

Command run:

```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "mZFIPVb/eeNVTDTtyN3OrkyTZ6vLUxYS" 6 5 6 4 5 4
```

Output:

```
[0, 1, 0, 0, 4, 2]
```

## Why this diverges

**From the default solution.** The obvious Save micro-interaction fills a hollow
bookmark with color on click and maybe pulses. Here color-fill is demoted to a
secondary cue; the load-bearing signal is *depth* — the button physically seats
into a recessed well. State is read from Z-position, so it survives on a
grayscale or color-blind display where a fill swap alone is ambiguous.

**From the assigned-axis baseline.** The axis says: diverge from visual-only
fill. The seed landed on *spatial displacement* (index 1) over the easier
faux-haptic bounce (index 2) or shape-change (index 4). So the feedback is
genuine layout/elevation change — press-in, held compression as the pending
spinner, and a docked resting depth — rather than a bounce that returns to the
same position. The squish-and-hold pending state (index 4, beating the common
ring-sweep and dot-pulse) reinforces this: the compression *is* the loading
indicator, keeping the whole interaction inside one physical metaphor instead of
overlaying a separate spinner graphic.
