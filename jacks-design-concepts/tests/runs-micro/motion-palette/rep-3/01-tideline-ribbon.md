# Concept: Tideline Ribbon

## Core idea
A bookmark button whose "saved" state floods in as a bottom-up liquid **clip-reveal** wipe; the bookmark's pennant tail droops when full, an **underline bar** anchors the confirmation and carries a live **save count**, and re-clicking runs the tide back out to un-save.

## Palette (invented, greenfield)
- Surface / toolbar: `#0E1116` (ink)
- Idle icon stroke: `#7A8699` (slate)
- Tide fill: `#2BD4A7` (mint) rising into `#12A37E` (deep mint) at the top
- Underline bar: `#2BD4A7` on `#1B2028` track
- Count text: `#C7D0DC`

## Key visual + interaction principles
- **Motion primitive = clip-reveal (tide wipe).** The bookmark glyph is a static outline. On save, a `clip-path` inset animates from `inset(100% 0 0 0)` (empty) to `inset(0 0 0 0)` (full), so mint appears to rise from the base of the bookmark to its notch. No opacity/color crossfade drives the change — the fill *reveals* by geometry.
- **State cue = pennant droop.** The bookmark's two bottom points (the "swallowtail" notch) relax downward ~6px once the tide tops out, so a filled bookmark visibly sags like a weighted ribbon. This is the persistent at-rest signal of "saved" independent of color.
- **Spatial anchor = underline bar.** Confirmation lives on a 2px bar directly beneath the button, not inside it. The bar draws left-to-right as the tide rises and stays lit while saved. This keeps the glyph itself uncluttered.
- **Feedback modality = numeric count.** The underline bar's right end shows the running save total (`142` -> `143`). The number tick-rolls up on save, down on un-save. This is the confirmation payload, not a toast.
- **Pending = skeleton shimmer.** While the save round-trips to the server, the glyph shows a diagonal skeleton shimmer sweeping across the fill area; the tide holds at its clicked level until the response lands, then completes (commit) or drains (rollback). Optimistic visually, honest about latency.
- **Un-save = reverse morph.** A second click runs the exact tide animation backward: fill drains top-to-bottom, pennant lifts back to straight, underline bar retracts right-to-left, count decrements.
- Responsiveness: tide starts on `pointerdown` (0ms), shimmer only appears if the network reply is >120ms out, so fast saves never flash a loader.

## ASCII wireframe

```
IDLE                 PENDING (shimmer)      SAVED
  ___                   ___                   ___
 |   |                 |///|  <- shimmer     |███|  filled tide
 |   |                 |///|                 |███|
 |   |                 |/  |  tide holding   |███|
 | ^ |  notch up       | ^ |                 |  v  |  pennant drooped
  ‾‾‾                   ‾‾‾                   ‾‾‾
                        ▁▁▁▁▁▁ 142            ▔▔▔▔▔▔ 143
   (no bar)            bar drawing            bar lit + count rolled

Click again on SAVED  ->  tide drains top-down, pennant lifts,
                          bar retracts R->L, count 143 -> 142.
```

## Seed-derived decisions

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "DNL3G2YrvZU2Okqx0bLGaxpTNT5g97TE" 6 5 5 5 5 5
```
Output:
```
[3, 4, 3, 4, 3, 3]
```

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|-------------------|--------|
| 0 | Motion primitive (assigned axis; no opacity/color tween) | 0=transform pop, 1=physics spring, 2=path morph, 3=clip-reveal tide wipe, 4=3D flip, 5=elastic stretch | `DNL3` | 3 | **clip-reveal tide wipe** |
| 1 | Feedback modality | 0=visual only, 1=+haptic, 2=+audio tick, 3=+tooltip text, 4=+numeric count | `G2Yr` | 4 | **numeric count** |
| 2 | Saved state cue | 0=filled icon, 1=color swap, 2=check badge, 3=pennant droop, 4=glyph swap | `vZU2` | 3 | **pennant droop** |
| 3 | Spatial anchor of confirmation | 0=in-button, 1=floating burst, 2=edge ribbon, 3=toolbar toast, 4=underline bar | `Okqx` | 4 | **underline bar** |
| 4 | Pending indicator | 0=spinner ring, 1=progress arc, 2=pulse dot, 3=skeleton shimmer, 4=none/optimistic | `0bLG` | 3 | **skeleton shimmer** |
| 5 | Un-save affordance | 0=same-button toggle, 1=long-press remove, 2=hover X, 3=click-again reverse morph, 4=secondary confirm | `axpT` | 3 | **click-again reverse morph** |

Segment-to-index mapping: decision point k uses seed chars [4k, 4k+4), 0-based; index picked stands regardless of preference.

## Why this diverges

**From the default solution.** The obvious Save button crossfades a hollow bookmark to a solid filled/blue one, maybe with a toast. Here the fill is a *geometric* rise (clip-path tide), the confirmation lives *outside* the glyph on an underline bar, the payload is a *live count* rather than a "Saved!" label, and the resting saved-state cue is a *shape change* (drooped pennant) that survives even in grayscale or for color-blind users.

**From the assigned-axis baseline.** The axis demanded any motion primitive except opacity/color tween. The naive escape is a transform pop (scale bounce) — index 0, and the first thing most people reach for. The seed instead landed on clip-reveal, so the whole interaction is built on *masked geometry over time*: the same tide path drives save (rise), pending (held level + shimmer), and un-save (drain). One reversible clip animation, not a color state machine.
