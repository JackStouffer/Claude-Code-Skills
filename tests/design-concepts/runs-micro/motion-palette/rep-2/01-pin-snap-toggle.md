# Concept: Pin-Snap Toggle

## Core idea
A pill-shaped bookmark button whose icon physically *snaps* — scales down on press, then pops up-and-over with a small transform (scale + rotate) as a checkmark badge lands on it — while a perimeter ring traces the pending save. One transform-driven gesture reads as "pinned," and clicking the same button snaps it back off.

## Key visual + interaction principles
- **Motion is transform, not fade.** Nothing dissolves in or shifts color to signal state. The bookmark glyph compresses (`scale(0.82)`) under the pointer, then over-shoots back (`scale(1.06) rotate(-6deg)` → `scale(1)`) — the "snap." The checkmark badge slides in on a `translateY` from behind the glyph, never on opacity.
- **Pending lives on the perimeter.** A 2px accent ring strokes clockwise around the pill's rounded edge while the save request is in flight. It is a `stroke-dashoffset` sweep on the border path — the icon inside stays still until the network confirms, so the snap only fires on real success.
- **Badge overlay carries the saved state.** "Saved" is not the glyph turning solid or changing hue; it is a small circular checkmark badge anchored to the pill's top-right corner. Badge present = saved; badge gone = not saved. This survives colorblindness and low-contrast displays because it is a shape change, not a color change.
- **Same button toggles.** No hover-X, no long-press. Click when saved → ring sweeps counter-clockwise, badge retracts on `translateY`, glyph does a reverse micro-snap. The affordance is discoverable because the pressed state always looks live.
- **Haptic + visual feedback.** On confirmed save/un-save, fire `navigator.vibrate(8)` (a single crisp tick) alongside the snap. Silent no-op where the API is absent — purely additive.
- **Palette: high-contrast mono + single accent.** Ink `#0B0D10`, paper `#F7F8FA`, hairlines `#C7CDD4`. One accent — electric lime `#B6FF3B` — used *only* for the pending ring and the checkmark badge fill. The glyph itself never recolors; the accent is reserved for the two moments that matter.
- **Responsiveness contract.** Press-down transform is instant (0ms, pure pointer feedback). Ring sweep runs during the actual request. Snap + badge + haptic all fire on the resolve, so the celebratory motion is honest about success. Target snap duration ~180ms with a slight overshoot easing.

## ASCII wireframe

```
DEFAULT (not saved)                PRESSED (0ms, pointer down)
 ┌───────────────┐                  ┌───────────────┐
 │   ▙   Save     │                  │  ▪  Save       │   glyph scale(0.82)
 │  ▔▔▔           │                  │  ▔▔            │   compressed
 └───────────────┘                  └───────────────┘
   pill, ink outline                  no color change yet

PENDING (request in flight)         SAVED (resolved: snap + badge + vibrate 8ms)
 ┌───────────────┐                  ┌───────────────┐╮
 │   ▙   Save    ◜│  ring strokes    │   ▚   Saved   (✔)  badge lands via translateY
 │  ▔▔▔          ◞│  clockwise in    │  ▔▔▔          │╯  glyph pops scale(1.06) rot(-6°)
 └──────◟────────┘  accent lime      └───────────────┘   ring completes, holds as edge
        sweep                          badge = accent lime fill, ink check

RE-CLICK WHEN SAVED
 ring sweeps counter-clockwise → badge retracts (translateY out) → glyph reverse-snap → default
```

## Seed-derived decisions

Seed: `7jXo/wCPnzmYs3Ub32JqppQu33DhhDNV`

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 0 | Motion primitive (assigned axis) | 0=transform scale/rotate pop, 1=physics-spring overshoot, 2=path morph outline→fill, 3=clip-path fill reveal, 4=SVG stroke draw-on, 5=particle burst | `7jXo` | 0 | **transform scale/rotate pop** |
| 1 | Feedback modality | 0=visual only, 1=haptic tick + visual, 2=audio tick + visual, 3=text-label swap | `/wCP` | 1 | **haptic tick + visual** |
| 2 | Saved-state cue | 0=solid-filled glyph, 1=accent color fill, 2=checkmark badge overlay, 3=stroke-weight change | `nzmY` | 2 | **checkmark badge overlay** |
| 3 | Pending spatial anchor | 0=inline glyph spinner, 1=perimeter ring, 2=underline progress bar, 3=none (optimistic) | `s3Ub` | 1 | **perimeter ring** |
| 4 | Un-save affordance | 0=same-button toggle, 1=hover-reveal X, 2=long-press to remove, 3=swipe/drag off | `32Jq` | 0 | **same-button toggle** |
| 5 | Button silhouette | 0=circle, 1=rounded square, 2=pill (icon+label), 3=bare icon no container | `ppQu` | 2 | **pill (icon+label)** |
| 6 | Palette temperament | 0=warm amber/ink, 1=cool teal/slate, 2=high-contrast mono + single accent, 3=deep violet/gold | `33Dh` | 2 | **high-contrast mono + single accent** |

Command run:

```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "7jXo/wCPnzmYs3Ub32JqppQu33DhhDNV" 6 4 4 4 4 4 4
```

Output:

```
[0, 1, 2, 1, 0, 2, 2]
```

## Why this diverges

**From the default solution.** The obvious Save button fades an icon from outline to solid and swaps a gray→accent color to mean "saved." This concept refuses both crutches: state is carried by a **shape** (checkmark badge present/absent) that reads without color, and the glyph itself never recolors or dissolves. Feedback is **haptic**, not just a silent visual change, and pending state is honestly gated on the network via a **perimeter ring** rather than an optimistic instant flip.

**From the assigned-axis baseline.** The axis demanded escaping opacity/color tweening. The seed landed on **transform** (index 0) — the most primitive alternative — so the entire signature is spatial: compress-on-press, overshoot snap with rotation, and a badge that arrives on `translateY`. No `opacity` and no `background-color` transition appears anywhere in the motion; every state change is a position or scale change. That keeps it distinct from any sibling concept that reaches for spring physics, morphs, or clip reveals on the same axis.
