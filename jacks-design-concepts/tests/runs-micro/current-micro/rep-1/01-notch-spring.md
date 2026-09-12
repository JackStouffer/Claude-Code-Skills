# Notch-Spring Bookmark

## Core idea
A Save icon that springs: on click the bookmark pops with an elastic overshoot pivoting from its bottom notch, fires a haptic tick, and settles into a solid accent-filled state — no instant color swap, motion carries the whole state change.

## Key visual + interaction principles
- **Palette (greenfield, invented):**
  - Surface `#12141A` (near-black slate) / light surface `#F5F6F8`
  - Idle icon stroke `#8A93A6` (cool grey, outline only)
  - Accent saved fill `#FF7A45` (warm coral — reads instantly against cool greys)
  - Accent shadow/glow `#FF7A45` at 24% alpha for the pop
- **Idle:** outline bookmark, 1.75px stroke, no fill. Cursor pointer, 40x40 hit target around a 20px glyph.
- **Click → spring:** the glyph scales `1.0 → 1.18 → 0.96 → 1.0` on a spring (overshoot), pivoting from the bottom-V notch so the tip whips up like a released clip. Coral fill floods the interior on the same beat. A single `navigator.vibrate(8)` fires on devices that support it (silently ignored elsewhere).
- **Pending (optimistic):** fill lands immediately; while the network request is in flight the whole glyph drops to ~70% opacity and breathes (slow pulse). On success the pulse stops at full opacity. On failure it drains back to outline and shakes 3px once.
- **Saved (rest):** solid coral bookmark, no pulse. This persistent fill IS the state cue.
- **Un-save:** hovering a saved button reveals a faint reverse hint (fill recedes ~15% + tooltip "Saved — click to remove"). Click plays a distinct *drain* motion — fill empties top-to-notch and the glyph relaxes down (no overshoot) back to outline, so add and remove never look identical.
- **A11y:** `<button aria-pressed>` toggles true/false; `prefers-reduced-motion` collapses spring/drain to a 120ms fill/empty with no scale, haptic still fires. Focus ring on the button, not the glyph.

## ASCII wireframe
```
 IDLE                 CLICK (spring)          SAVED (rest)
 +--------+           +--------+              +--------+
 |  ___   |           |  ___   |  pop!        |  ###   |
 | |   |  |   -->     | |###|  | ↑ overshoot  | |###|  |
 | |   |  |           | |###|  | (pivot ↓)    | |###|  |
 |  \ /   |           |  \#/   | ~vibrate     |  \#/   |
 +--------+           +--------+              +--------+
   outline             filling                 coral, solid

 PENDING (in flight)          UN-SAVE (hover -> click)
 +--------+                   +--------+   drain top->notch
 | .###.  |  breathing        | |   |  |   fill recedes
 | .###.  |  ~70% opacity     | |   |  |   relax down (no pop)
 |  \#/   |  pulse            |  \ /   |   -> outline
 +--------+                   +--------+
          notch = bottom V, the motion pivot for every transition
```

## Seed-derived decisions
Seed: `cRyevbvz44/cIEX9wI3Shnt3t5kHsAYU`

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Motion primitive (core transition) | 0 cross-fade morph outline→filled; 1 3D card flip; 2 liquid ink fill rising; 3 elastic scale-pop w/ overshoot (spring); 4 self-drawing stroke path | `cRye` | 3 | **3 elastic scale-pop spring** |
| 2 | Feedback modality (beyond color) | 0 haptic + visual; 1 audio tick + visual; 2 purely visual; 3 emitted-particle burst | `vbvz` | 0 | **0 haptic + visual** |
| 3 | Persistent saved-state cue | 0 solid accent fill of glyph; 1 small badge dot; 2 background chip color inversion; 3 underline indicator; 4 label text change | `44/c` (chars 8–11) | 0 | **0 solid accent fill** |
| 4 | Spatial anchor / origin of motion | 0 geometric center; 1 bottom edge baseline; 2 top-left corner; 3 bookmark notch (bottom V) as pivot | `IEX9` | 3 | **3 notch pivot** |
| 5 | Un-save affordance | 0 same-button silent toggle; 1 long-press to remove; 2 hover reveals reverse hint + distinct drain motion; 3 click again → undo toast | `wI3S` | 2 | **2 hover hint + drain** |
| 6 | Pending-state representation | 0 spinner ring; 1 dim + breathing pulse (optimistic); 2 progress bar under icon; 3 skeleton shimmer; 4 animated dashed outline | `hnt3` | 1 | **1 dim + breathing pulse** |

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "cRyevbvz44/cIEX9wI3Shnt3t5kHsAYU" 5 4 5 4 4 5
```
Output:
```
[3, 0, 0, 3, 2, 1]
```

## Why this diverges
- **From the default solution:** the baseline Save button does an instant outline→filled color swap on click. Here color never swaps on its own — an elastic spring with overshoot, pivoting off the notch, is the state change; the fill rides along with it.
- **From the assigned-axis baseline (Motion language):** the axis says diverge from instant color swap. The seed pushed past the obvious "smooth cross-fade" (option 0) to a physical spring (option 3), and paired it with a *different* reverse motion (drain, not a mirror of the pop) so add and remove are legibly distinct — plus a haptic beat and an optimistic breathing pending state, so the feedback is multi-channel rather than a single visual toggle.
