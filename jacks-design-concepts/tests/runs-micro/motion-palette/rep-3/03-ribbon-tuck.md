# Ribbon Tuck

## Core idea
A bookmark-ribbon icon that saves in three discrete beats: a tap-acknowledge dip at the cursor, the ribbon physically folding down and tucking into a pocket, then a small "Saved" label settling in. Un-saving plays the exact same choreography in reverse — the ribbon unfurls and lifts back out.

## Palette (greenfield)
- Toolbar surface: `#1B1F27` (slate)
- Idle glyph stroke: `#8A93A6` (muted steel)
- Active ribbon fill: `#F2A93B` (amber)
- Pocket / tuck shadow: `#12151B`
- Tooltip chip: `#2A303C` bg, `#E8EBF1` text

## Key visual + interaction principles
- **Motion primitive — ribbon fold/unfurl.** The glyph is a two-panel bookmark ribbon. Saving folds the lower notch flat and tucks the whole ribbon a few px down into a "pocket" (a clipped mask at the button's lower edge). It is a paper-fold metaphor, not a fade or a scale.
- **Timing structure — staged sequence (assigned axis).** Three separately-timed beats with a hold between them, not one continuous ease:
  - Beat 1 (0–90ms): press-acknowledge — glyph dips 2px toward the click point, stroke brightens. Registers the intent instantly.
  - Beat 2 (90–320ms): the fold — ribbon notch folds flat, panel rotates on its base edge, amber fill wipes up as it tucks into the pocket.
  - Beat 3 (320–480ms): settle — filled glyph rests at final position; "Saved" tooltip chip rises 4px and fades in beneath.
  Each beat has its own curve and a ~30ms hold, so the eye reads distinct events rather than a blur.
- **Feedback modality — micro-tooltip label.** A tiny "Saved" chip appears under the button on beat 3, auto-dismissing after ~900ms. Toggling off shows "Removed".
- **Persistent saved cue — filled glyph.** Once saved, the ribbon stays solid amber. Idle/unsaved is a steel outline. State is legible with zero motion and independent of color perception (fill vs. outline).
- **Spatial anchor — click point.** Beat 1's dip and the fold's pivot originate from where the cursor landed, so the interaction feels like it responds to *your* touch, not a canned center animation.
- **Un-save affordance — reverse scrub.** Clicking a saved button plays the whole sequence backward: ribbon lifts out of the pocket, unfolds, fill drains, outline returns. Same choreography, negated timeline — no separate "delete" UI.
- Responsiveness: beat 1 fires on `pointerdown` so perceived latency is ~0; the network/save commit is optimistic and beats 2–3 run regardless, reconciling silently on failure by reversing.
- Accessibility: `aria-pressed` toggles; `prefers-reduced-motion` collapses all three beats to an instant fill swap + tooltip.

## ASCII wireframe

```
IDLE (unsaved)              BEAT 1  press @cursor        BEAT 2  fold + tuck
 ┌───────┐                   ┌───────┐  (x = click)       ┌───────┐
 │  /\   │  steel outline    │  /\ x │  dip 2px           │ ▛▜    │  notch folds
 │ /  \  │                   │ /  \  │  stroke brightens   │ ▙▟    │  fill wipes up
 │ \  /  │                   │ \  /  │                     │ ══════│  tucks into
 │  \/   │                   │  \/   │                     │▒pocket▒│  pocket
 └───────┘                   └───────┘                    └───────┘

BEAT 3  settle              SAVED (rest)                 UN-SAVE  reverse scrub
 ┌───────┐                   ┌───────┐                    ┌───────┐  ribbon lifts,
 │ ▛▜    │  filled amber     │ ▟█▙   │  solid amber        │  /\   │  unfolds,
 │ ▟█▙   │                   │ █████ │                     │ /  \  │  fill drains
 └───┬───┘                   │ █████ │                     └───────┘
   ┌─┴───┐ rises 4px         │  ▜█▛  │                        outline returns
   │Saved│ fades in          └───────┘                     [ Removed ] chip
   └─────┘
```

## Seed-derived decisions

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Motion primitive | 0 fill-sweep · 1 pin-drop scale · 2 ribbon fold/unfurl · 3 rotate-flip · 4 particle burst | `7XG5` | 2 | **ribbon fold/unfurl** |
| 2 | Timing structure (assigned axis) | 0 staged discrete-beat sequence · 1 overshoot-settle spring · 2 interruptible-reversible scrub · 3 anticipation-then-release | `7C0n` | 0 | **staged discrete-beat sequence** |
| 3 | Feedback modality | 0 color only · 1 haptic+color · 2 audio blip · 3 micro-tooltip label · 4 numeric count bump | `mXJH` | 3 | **micro-tooltip label** |
| 4 | Persistent saved cue | 0 filled glyph · 1 badge dot · 2 underline bar · 3 color-only swap | `Ol8u` | 0 | **filled glyph** |
| 5 | Spatial anchor (motion origin) | 0 click point/cursor · 1 glyph center · 2 bottom edge · 3 top notch | `PQ9j` | 0 | **click point** |
| 6 | Un-save affordance | 0 same-click toggle · 1 long-press remove · 2 hover-reveal X · 3 reverse scrub (backward animation) | `3hpX` | 3 | **reverse scrub** |

Command run:

```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "7XG57C0nmXJHOl8uPQ9j3hpXjMmbhJDm" 5 4 5 4 4 4
```

Output:

```
[2, 0, 3, 0, 0, 3]
```

## Why this diverges

**From the default solution.** The obvious Save micro-interaction is a bookmark that fills with a single ease and maybe a color flip (DP1=0, DP2=1-ish, DP3=0, DP6=0 same-click toggle). This concept instead treats the ribbon as a physical object that *folds and tucks*, and uses a labelled tooltip rather than relying on color alone.

**From the assigned-axis baseline (single-ease timing).** The seed forced option 0 on the timing axis: a **staged discrete-beat sequence**. Motion is deliberately broken into three separately-clocked events (acknowledge → fold → settle) with holds between them, so the user perceives cause-and-effect steps instead of one smooth tween. The un-save reverse-scrub (DP6=3) reuses that same beat structure negated, which only makes sense *because* the timeline is composed of discrete, reversible segments — the two seed picks reinforce each other into a coherent staged, reversible motion system that a default single-ease design could not express.
