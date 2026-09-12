# Reversible Ribbon Scrub

## Core idea
A bookmark ribbon unfurls downward and drops into a "pocket" at the button's
bottom edge on save; clicking again scrubs that exact motion backward to
un-save, so a mid-flight reversal simply rewinds along one shared timeline
rather than firing a new animation.

## Key visual + interaction principles
- **One reversible timeline, not two animations.** Save and un-save are the
  same 0->1 progress value played forward or backward. Any click flips the
  target; the ribbon eases toward it from wherever it currently is. Rapid
  double-click nets to a clean no-op with no queued animation.
- **Bottom-edge pocket anchor.** The ribbon originates and settles at the
  button's bottom edge, as if slotted into a shallow pocket. The unfurl grows
  downward from that edge; the rewind retracts back into it.
- **State cue = icon shape swap.** Unsaved is an open outline bookmark; saved
  is a solid filled bookmark. Progress morphs outline->solid in lockstep with
  the ribbon so the mid-scrub state is always legible (half-filled = pending).
- **Haptic-style visual pulse at commit.** When progress crosses the settle
  point, a single tight radial pulse (a 1-frame scale bump + brief ring)
  mimics a haptic tick, confirming the latch without sound or text.
- **Responsiveness.** The button reacts on pointerdown by starting the scrub
  immediately (optimistic). If the network save fails, the same timeline
  rewinds itself and shows the outline state again.

Palette (invented): deep **plum** `#3B1F4B` surface / idle outline, **chartreuse**
`#C8F03C` for the filled ribbon + pulse ring, soft plum-tint `#5A3A6E` for the
pocket recess, paper `#F4EEF8` glyph on filled state.

## ASCII wireframe
```
 IDLE (unsaved, outline)        MID-SCRUB (~0.5, interruptible)     SAVED (filled, pocketed)
 +----------+                   +----------+                        +----------+
 |   /\     |                   |   /\     |                        |  /##\    |
 |  /  \    |   click / hold     |  /##\    |   click again = rewind |  |####|  |
 |  |  |    |  ---------------->  |  |##|    |  <------------------->  |  |####|  |
 |  |__|    |                   |  |__|    |                        |  \####/  |
 +====\/====+  <- bottom edge    +==\##/==+  ribbon dropping into    +===\/====+  ribbon
      pocket                        pocket (scrubbing)                  seated + (pulse)
```
The `\/` notch at the bottom edge is the pocket; the ribbon (`##`) unfurls
down into it as progress rises, retracts as it falls. A momentary chartreuse
ring blooms once around the button at the settle crossing.

## Seed-derived decisions

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Timing structure (assigned axis) | 0 staged sequence, 1 overshoot-settle spring, 2 interruptible-reversible scrub, 3 elastic anticipation-then-snap, 4 cascade stagger | `1l+f` | 2 | **interruptible-reversible scrub** |
| 2 | Motion primitive | 0 fill sweep, 1 outline->solid morph, 2 scale pop, 3 ribbon unfurl, 4 particle burst, 5 path-draw stroke | `B1M9` | 3 | **ribbon unfurl** |
| 3 | Extra feedback modality | 0 pure visual only, 1 visual haptic-style pulse, 2 micro-sound cue, 3 text label toast, 4 color-temperature shift | `2Sz8` | 1 | **visual haptic-style pulse** |
| 4 | State cue | 0 fill color, 1 icon shape swap (outline<->filled), 2 badge dot, 3 background pill, 4 tilt/angle | `65oI` | 1 | **icon shape swap** |
| 5 | Spatial anchor / motion origin | 0 from click point, 1 from icon centroid, 2 from bottom edge (pocket), 3 from top ribbon, 4 radial from center | `U/1j` | 2 | **from bottom edge (pocket)** |
| 6 | Palette | 0 ink + amber, 1 deep teal + coral, 2 plum + chartreuse, 3 slate + electric-lime, 4 warm-paper + vermilion | `BBhB` | 2 | **plum + chartreuse** |

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "1l+fB1M92Sz865oIU/1jBBhBtjnnmq01" 5 6 5 5 5 5
```
Output:
```
[2, 3, 1, 1, 2, 2]
```

## Why this diverges
**From the default solution:** the obvious Save-button micro-interaction is a
single-ease fill or a scale-pop with a checkmark. This uses neither a fill
sweep nor a pop; it is a downward ribbon unfurl anchored at the bottom edge
(a pocket), which almost no default reaches for.

**From the assigned-axis baseline (timing):** the assigned axis is timing
structure, and its easy divergences are staged sequences or overshoot-settle
springs. The seed landed on **interruptible-reversible scrub** instead: there
is exactly one progress timeline shared by save and un-save, scrubbable in
either direction and reversible mid-flight. That makes un-saving a first-class
rewind (not a separate reverse animation) and makes fast repeated clicks
resolve to a clean net state instead of stacking or stuttering — a materially
different timing model from both single-ease and staged/overshoot baselines.
