# Concept 02 — Haptic Tack

## Core idea
A bookmark that behaves like a physical tack pinned through its top edge: clicking snaps it down with an anticipation-and-release recoil, and it settles hanging at a slight tilt — the "saved" state is read from the cocked angle, not from a color fill. The whole confirmation is felt as a faux-haptic micro-bounce rather than watched as a fill sweep.

## Key visual + interaction principles
- **Feedback is kinetic, not chromatic.** Confirmation is carried by a spring recoil + a held tilt. Color stays constant; the eye reads *motion and pose*, so the cue survives for colorblind users and in peripheral vision.
- **Top-pin pivot.** The icon is pinned at a single point on its top edge (like a real pushpin through a paper tag). All motion rotates/swings about that pin, giving the object a believable center of mass.
- **Anticipation → snap.** On press: a tiny pull *up/back* toward the pin (wind-up ~40ms), then a fast release swing down past target, then one damped overshoot to rest. Snappy overall: ~150ms.
- **Rest pose = state.** Unsaved hangs straight (0°). Saved rests cocked at a fixed ~12° tilt off the pin, as if a real tag settled crooked when tacked. The angle *is* the confirmation and persists.
- **Un-save via hover reveal.** Hovering a saved tack surfaces a faint "×" scrim/notch micro-cue over the icon; clicking then releases it — it swings back through vertical with the same spring and un-cocks to 0°. No accidental un-save from a stray click, and the destructive intent is telegraphed before it fires.
- **Palette: electric lime on charcoal.** Charcoal well/toolbar (#1B1B1E), lime tack (#C6FF3D) with a slightly darker lime edge for the "pin". High-contrast, energetic, greenfield.
- **Accessibility:** `aria-pressed` reflects saved state; `prefers-reduced-motion` swaps the recoil for an instant tilt snap (pose still encodes state); the hover "×" also appears on keyboard focus.

## ASCII wireframe
```
   TOOLBAR (charcoal #1B1B1E)
  ┌───────────────────────────────────┐
  │  [◱] [◲] [⌗]        ( ▽ )   [⋯]   │   unsaved: hangs straight, 0°
  └───────────────────────────────────┘
                         pin•
                          |
                         ▽            press: wind up toward pin (~40ms)
                          ↓ snap
                         ▼            release + one overshoot (~150ms total)

  SAVED (rests cocked ~12°, lime, no fill sweep):
                         pin•
                          |
                          ◹            held tilt = "saved"

  HOVER over saved (un-save affordance):
                         pin•
                          |
                         (◹×)         faint "×" micro-cue; click swings back to 0°
```

## Seed-derived decisions

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 0 | Feedback modality (assigned axis) | 0:faux-haptic micro-bounce / 1:shape morph outline→ribbon / 2:spatial displacement into slot / 3:ink-flood weight tilt / 4:recoil kickback stamp | `uxib` | 0 | **0 faux-haptic micro-bounce** |
| 1 | Motion primitive | 0:spring/elastic overshoot / 1:anticipation-then-snap / 2:ease-out decay / 3:two-stage stagger / 4:rubber-band settle | `mri0` | 1 | **1 anticipation-then-snap** |
| 2 | Saved-state resting cue | 0:filled solid icon / 1:persistent recess depth / 2:dot/badge notch / 3:held weight-tilt angle | `4UHz` | 3 | **3 held weight-tilt angle** |
| 3 | Spatial anchor / pivot origin | 0:bottom-anchored swing / 1:center-scale / 2:top-pin pivot / 3:bottom-left corner | `9fvE` | 2 | **2 top-pin pivot** |
| 4 | Un-save affordance | 0:same click toggles reverse / 1:long-press to release / 2:click pops out of slot / 3:hover reveals "×" then click / 4:second-click peel-back | `1gFo` | 3 | **3 hover "×" reveal then click** |
| 5 | Palette mood | 0:amber/honey on ink / 1:teal/mint on slate / 2:coral on cream / 3:indigo/violet on bone / 4:electric lime on charcoal / 5:—unused— | `LExW` | 4 | **4 electric lime on charcoal** |
| 6 | Timing character | 0:snappy 120-180ms / 1:bouncy 300-400ms / 2:crisp 90ms + tail / 3:deliberate weighty 250ms | `mIwq` | 0 | **0 snappy 120-180ms** |

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "uxibmri04UHz9fvE1gFoLExWmWIwqi1T" 5 5 4 4 5 6 4
```
Output:
```
[0, 1, 3, 2, 3, 4, 0]
```

## Why this diverges
- **From the default solution:** The default Save micro-interaction is a fill sweep — outline bookmark flooding to solid, confirmed purely by color change. Haptic Tack holds color constant and confirms through *pose and recoil*. There is no fill event at all.
- **From the assigned-axis baseline:** The generic faux-haptic answer is a symmetric center-scale squash-bounce. The seed pinned this to a *top-pin pivot* with *anticipation-then-snap*, so the bounce is an off-center pendulum recoil about a physical pin — and the rest state encodes "saved" as a *held tilt angle* rather than snapping back to neutral. The motion has an anchor and a memory, not just a springy pop.
