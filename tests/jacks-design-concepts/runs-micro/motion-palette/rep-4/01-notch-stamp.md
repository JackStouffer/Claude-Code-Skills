# Notch Stamp

## Core idea
A Save icon that stamps itself into place: on click the bookmark scales up from its own notch-point like a rubber stamp pressing down, a checkmark punches through as it lands, and a dog-eared corner fold stays folded to mark the saved state.

## Key visual + interaction principles
- The button is a bookmark glyph. Its scale animation originates from the notch (the inner V at the bottom of the ribbon), so it reads as pressing *down into* the toolbar rather than growing from center.
- Confirmation is a discrete checkmark stamp that punches over the glyph on landing — a hard, momentary overlay, not a fade.
- Saved is communicated persistently by a folded top-right corner (dog-ear), so state survives even after the animation and after hover leaves.
- Latency is honest: while the save request is in flight the button disables and the glyph is replaced by an inline spinner. The stamp/fold only commit on server success, so the cue never lies.
- Un-saving is a plain re-click; on success an undo snackbar appears ("Removed — Undo") to make the destructive-feeling action recoverable without cluttering the button itself.
- Palette: deep teal surface/glyph, warm gold as the saved accent (fill of the corner fold + checkmark). Reduced-motion users get the same state changes with the scale/stamp collapsed to instant swaps.

## Interaction timeline
1. Idle: outline bookmark, teal stroke on a pale surface.
2. Click: button disables, glyph swaps to a small teal spinner (pending).
3. Success: spinner clears, bookmark scale-pops from its notch (fast overshoot, ~180ms), checkmark stamp punches over it for ~250ms then lifts, top-right corner folds gold and stays.
4. Re-click while saved: disables + spinner again; on success corner unfolds, glyph returns to outline, and an undo snackbar slides in.

## ASCII wireframe
```
IDLE                PENDING             SAVED (persistent)
┌──────┐            ┌──────┐            ┌──────┐╲ gold fold
│  ▁▁  │            │      │            │  ██  │▔╲
│ │  │ │            │  ◜◝   │            │ ████ │
│ │  │ │            │  ◟◞   │            │ █▁▁█ │   <- notch = scale origin
│ ╲  ╱ │            │ spin  │            │ ╲██╱ │
│  ╲╱  │            │       │            │  ╲╱  │
└──────┘            └──────┘            └──────┘

CONFIRM STAMP (transient, on success)
┌──────┐
│  ▁▁  │      ✓ punches over glyph, scales from
│ │ ✓│ │      the notch, overshoots, then lifts
│ ╲  ╱ │
│  ╲╱  │
└──────┘

UNDO (after un-save)
  ┌─────────────────────────────┐
  │ Removed from saved   [Undo]  │
  └─────────────────────────────┘
```

## Seed-derived decisions
Command:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "/mqCKg1PigonvQ3YQRq7FPKNL2xecrCc" 6 5 5 4 4 4 5
```
Output:
```
[0, 2, 4, 3, 3, 3, 2]
```

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|---|---|---|---|---|
| 0 | Motion primitive (assigned axis) | 0 transform scale-pop · 1 physics-spring overshoot · 2 icon path morph · 3 clip-path fill reveal · 4 3D rotateY flip · 5 rising liquid mask | `/mqC` | 0 | transform scale-pop |
| 1 | Confirmation feedback modality | 0 pulse ring · 1 particle burst · 2 checkmark stamp overlay · 3 sound-only · 4 side label toast | `Kg1P` | 2 | checkmark stamp overlay |
| 2 | Persistent saved-state cue | 0 filled vs outline glyph · 1 background pill swap · 2 accent dot · 3 ribbon tail extends · 4 corner fold badge | `igon` | 4 | corner fold badge |
| 3 | Pending / latency handling | 0 optimistic instant · 1 progress arc ring · 2 shimmer glyph · 3 disable + spinner replaces icon | `vQ3Y` | 3 | disable + spinner replaces icon |
| 4 | Un-save affordance | 0 toggle reverse-anim · 1 long-press to remove · 2 hover reveals x · 3 undo snackbar | `QRq7` | 3 | undo snackbar |
| 5 | Spatial anchor / motion origin | 0 center · 1 top edge (hangs) · 2 cursor click point · 3 bookmark notch (V) | `FPKN` | 3 | bookmark notch (V) |
| 6 | Palette (greenfield) | 0 ink navy/cream + amber · 1 slate + coral · 2 deep teal + warm gold · 3 charcoal + lime · 4 plum + peach | `L2xe` | 2 | deep teal + warm gold |

Segment-to-index check: i=0 uses chars [0:4]=`/mqC`, i=1 [4:8]=`Kg1P`, i=2 [8:12]=`igon`, i=3 [12:16]=`vQ3Y`, i=4 [16:20]=`QRq7`, i=5 [20:24]=`FPKN`, i=6 [24:28]=`L2xe`.

## Why this diverges
- **From the default solution:** the common Save button just cross-fades an outline glyph to a solid filled glyph (opacity/color tween) and calls it done. This concept uses none of that: motion is a transform scale-pop, confirmation is a discrete punched stamp, and persistent state is a structural corner fold rather than a color/fill swap.
- **From the assigned-axis baseline:** the assigned axis says "diverge from opacity/color tween" and the obvious transform move is a center scale or a spring bounce. The seed landed on transform scale-pop but anchored to the bookmark's *notch* (DP5=3), so the motion reads as a stamp pressing down into the toolbar from the glyph's own geometry — a distinct feel from a generic centered pop.
