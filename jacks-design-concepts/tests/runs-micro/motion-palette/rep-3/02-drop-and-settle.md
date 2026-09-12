# Drop & Settle

## Core idea
The Save button behaves like a physical token dropped into a slot: on click the
bookmark icon falls a few pixels and settles with an ease-out landing, reading
"saved" through weight and a color shift rather than a fill sweep. Clicking a
saved button pops the token back up and out of the slot to un-save.

## Key visual + interaction principles
- **Feedback = gravity/weight.** The primary confirmation is spatial: the icon
  drops into a shallow recessed slot and settles, so the save *lands*. No fill
  animation carries the message.
- **Motion = ease-out decelerate.** The drop is not a bouncy spring; it
  decelerates into place like a weighted object coming to rest against a stop —
  fast start, soft landing, no overshoot oscillation.
- **State cue = color shift only.** Once landed, the icon changes color (muted
  slate outline -> saturated teal). Shape and fill style stay identical; color
  alone distinguishes saved from unsaved, keeping the eye on the motion.
- **Pending = inline dot.** Between click and server-confirm, a small teal dot
  sits in the slot beside/under the icon as a lightweight "in flight" marker.
  Optimistic: the drop plays immediately; the dot resolves (fades) on ack, or
  the token pops back up on failure.
- **Un-save = reverse spatial displacement.** Clicking a saved button plays the
  displacement in reverse: the token rises out of the slot, lifts a few px above
  the toolbar baseline, and returns to the resting outline + slate color.
- **Palette = teal on off-white.** Off-white toolbar (#F4F2EC), slot shadow in
  warm gray, icon slate (#3A4A55) unsaved -> teal (#0E9C92) saved, dot teal.
- Responsive: drop begins on pointerdown (<16ms), so the token is already moving
  before the network call starts. Full landing ~180ms. `prefers-reduced-motion`
  collapses the drop to an instant slot-snap + color change, dot still shown.
- Accessibility: `aria-pressed` toggles saved/unsaved; slot has a visible focus
  ring; color shift is paired with the vertical position change so it never
  relies on hue alone.

## ASCII wireframe

```
UNSAVED (resting, above slot)          PENDING (dropped, dot in flight)
 ┌──────────┐                           ┌──────────┐
 │   ⌷  ⌷   │  <- slate outline icon    │          │  icon has dropped in
 │  ╭────╮  │     sits on baseline      │  ╭────╮  │
 │  │ ▽  │  │                           │  │ ▽  │  │  <- teal, seated in slot
 │  ╰────╯  │                           │  ╰────╯•│  <- inline teal dot = pending
 │ ‗‗‗‗‗‗‗‗ │  <- empty recessed slot   │ ‗‗‗‗‗‗‗‗ │
 └──────────┘                           └──────────┘

SAVED (settled, dot resolved)          UN-SAVING (reverse pop-up)
 ┌──────────┐                           ┌──────────┐
 │          │                           │  ╭────╮  │  <- token rising out,
 │  ╭────╮  │                           │  │ ▽  │  │     lifts above baseline
 │  │ ▽  │  │  <- teal, at rest in slot │  ╰────╯  │     then returns to slate
 │  ╰────╯  │                           │          │
 │ ‗‗‗‗‗‗‗‗ │                           │ ‗‗‗‗‗‗‗‗ │
 └──────────┘                           └──────────┘

drop path:  start (baseline) --ease-out--> settle (slot floor), ~180ms
```

## Seed-derived decisions

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "JBRiTUwvjZfothUDHuTiv53EEK+5Z0ao" 6 5 5 5 5 5
```
Output:
```
[3, 1, 4, 3, 3, 1]
```

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Feedback modality (assigned axis; non-fill only) | 0 faux-haptic micro-bounce / 1 shape morph / 2 spatial displacement into slot / 3 weight-gravity settle w/ overshoot-free landing / 4 elastic pull-and-snap / 5 tactile press-depth | `JBRi` | mod 6 = 3 | **3 weight/gravity settle** |
| 2 | Motion primitive / easing | 0 spring overshoot / 1 ease-out decelerate / 2 anticipation pull-back / 3 multi-bounce / 4 instant snap+micro-settle | `TUwv` | mod 5 = 1 | **1 ease-out decelerate** |
| 3 | Saved-state cue | 0 outline->solid fill / 1 ribbon tail extends / 2 coin flip rotation / 3 dog-ear fold appears / 4 color shift only | `jZfo` | mod 5 = 4 | **4 color shift only** |
| 4 | Pending indicator | 0 skeleton pulse / 1 progress arc / 2 squash-hold / 3 inline dot / 4 no pending (pure optimistic) | `thUD` | mod 5 = 3 | **3 inline dot** |
| 5 | Un-save affordance | 0 replay same anim reversed in place / 1 long-press / 2 hover reveals x / 3 reverse spatial displacement (pop-up) / 4 swipe/drag off | `HuTi` | mod 5 = 3 | **3 reverse spatial displacement** |
| 6 | Palette accent | 0 amber/gold on charcoal / 1 teal on off-white / 2 coral on ink / 3 indigo on cream / 4 emerald on slate | `v53E` | mod 5 = 1 | **1 teal on off-white** |

## Why this diverges

- **From the default solution:** the default Save micro-interaction confirms via
  a fill sweep on a static bookmark (outline paints solid in place). Here the
  icon does not fill at all — confirmation is a physical *drop into a slot*, and
  saved-vs-unsaved is read from vertical position plus a color change, not fill.
- **From the assigned-axis baseline:** the axis asks to leave visual-only fill.
  Within non-fill feedback the obvious pick is a faux-haptic bounce (index 0);
  the seed instead landed on weight/gravity settle (index 3) paired with
  ease-out decelerate (not a springy bounce), giving a heavier, "object coming
  to rest" feel rather than a jitter. Un-save reuses the same spatial channel in
  reverse (token pops back out), so the whole interaction stays in the
  displacement dimension the axis pushed toward, top to bottom.
