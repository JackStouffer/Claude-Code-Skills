# Concept 02 — Hold-to-Stamp

## Core idea
You press and *hold* the bookmark to commit the save — a fill rises under your finger like a stamp being pressed into a page, and on release it snaps down with a burst confirming it stuck. Holding again lifts (un-saves) it.

## Key visual + interaction principles
- **Palette (greenfield, invented):**
  - Surface / toolbar: `#14161C` (near-black slate)
  - Idle icon stroke: `#7B8494` (muted steel)
  - Dwell fill + accent: `#3DD68C` (spring green)
  - Committed solid: `#2FB877` (deeper green)
  - Particle burst: `#8CF2C4` (pale mint) + `#FFFFFF` sparks
  - Pending spinner: `#3DD68C` on 20% track
- **Interaction: press-and-hold to commit (dwell).** A tap alone does nothing decisive — it only previews. You must hold ~350ms; a fill sweeps up the bookmark silhouette tracking hold duration. Release *before* the fill completes = cancel, fill drains back to outline. Release *after* completion = commit. This makes save deliberate and un-fat-fingerable, and gives a natural scrubbable "are you sure" window.
- **Motion primitive: stamp / press-down scale.** During hold the button depresses (scale 1.0 → 0.92, inset shadow deepens) as if physically pressed into the surface. On commit it rebounds (0.92 → 1.06 → 1.0) — the stamp lifting off the page.
- **Feedback modality: particle burst.** At the commit instant, 6–8 mint/white particles fling outward and fade (~400ms). Purely additive; the shape change alone still reads without it (reduced-motion disables particles, keeps the fill + check).
- **State cue: checkmark overlay.** Resting saved state = solid green bookmark with a small white check notched into its lower half. Unambiguous "done," distinct from a merely-hovered or dwelling icon.
- **Spatial anchor: icon center.** Fill origin, burst origin, and depress pivot all radiate from the geometric center of the bookmark glyph — the whole gesture has one focal point under the cursor.
- **Pending: tiny inline spinner replacing icon.** After commit the save request goes async: the glyph is briefly swapped for a small spinner in-place (same bounding box, no layout shift) until the server ACKs, then the solid+check resolves in. On failure it reverts to outline with a red flash.
- **Un-save: long-press to remove.** Symmetric with save — you long-press the saved (solid) button; the fill *drains* downward over the dwell window and releases to outline. A stray single tap on a saved item does NOT remove it (prevents accidental loss), matching the deliberate-save intent.

## ASCII wireframe

```
IDLE (outline)              HOLDING (dwell ~40%)        COMMIT BURST
  toolbar                     toolbar                     toolbar
 ┌───────────┐               ┌───────────┐               ┌───────────┐
 │   ┌─┐     │               │   ┌─┐     │               │  \  ┌█┐  / │
 │   │ │     │   press &     │   │ │     │   release      │ — ( █▉ ) — │
 │   │ │     │   hold  ──►   │   │▁│     │   after full   │  /  █▉  \  │
 │   └V┘     │               │   └V┘     │   ──► burst    │   └V┘     │
 └───────────┘               │ ▓ scrub ▓ │               └───────────┘
  stroke #7B8494              └───────────┘                from center
                              fill rises,                  6–8 particles
                              button depresses

PENDING (async)             SAVED (rest)                UN-SAVE (long-press)
 ┌───────────┐               ┌───────────┐               ┌───────────┐
 │   ( ◜ )   │   spinner      │   ┌█┐     │   hold on      │   ┌█┐     │
 │   ( ◞ )   │   in place ──► │   │█│     │   solid  ──►   │   │▔│     │  fill
 │           │   ACK          │   └█✓┘    │   to remove    │   └V┘     │  drains
 └───────────┘               └───────────┘               └───────────┘
                              solid #2FB877               back to outline
                              + white check
```

## Seed-derived decisions

Seed: `cedZWq56QrQ/B0xxmoAootb0tADXmUCQ`

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Save-trigger interaction model | 0=press-and-hold dwell · 1=double-tap · 2=drag-into-slot · 3=click-then-slide-confirm · 4=click-to-arm then confirm-click · 5=flick/swipe-up | `cedZ` | 0 | **press-and-hold dwell** |
| 2 | Motion primitive | 0=fill sweep · 1=outline→ribbon morph · 2=stamp/press-down scale · 3=ink-drop radial · 4=ribbon unfurl | `Wq56` | 2 | **stamp/press-down scale** |
| 3 | Feedback modality (beyond shape) | 0=haptic pulse · 1=micro-sound tick · 2=color shift only · 3=particle burst · 4=label/tooltip text | `QrQ/` | 3 | **particle burst** |
| 4 | Persistent saved-state cue | 0=solid fill only · 1=dot badge · 2=hanging ribbon tail · 3=glow ring halo · 4=checkmark overlay | `B0xx` | 4 | **checkmark overlay** |
| 5 | Spatial anchor of confirmation | 0=cursor/click point · 1=icon center · 2=icon top/notch · 3=button bottom edge · 4=fixed toolbar origin | `moAo` | 1 | **icon center** |
| 6 | Pending (in-flight) treatment | 0=indeterminate ring · 1=pulsing dim · 2=skeleton fill rising · 3=inline spinner replacing icon · 4=hold-progress arc | `otb0` | 3 | **inline spinner replacing icon** |
| 7 | Un-save affordance | 0=same gesture reverses · 1=single tap when saved · 2=long-press to remove · 3=swipe-off · 4=hover-reveal X | `tADX` | 2 | **long-press to remove** |

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "cedZWq56QrQ/B0xxmoAootb0tADXmUCQ" 6 5 5 5 5 5 5
```
Output:
```
[0, 2, 3, 4, 1, 3, 2]
```

## Why this diverges

**From the default solution.** The obvious Save button is a single click that instantly toggles filled/unfilled. Here save is *not* instant or single-click: it requires a deliberate press-and-hold dwell with a scrubbable cancel window, and un-saving requires the same held gesture — a plain tap never mutates state. The commit is physicalized as a stamp press (depress → rebound) rather than a flat color swap.

**From the assigned-axis baseline (interaction model).** The axis baseline for "not single click-to-toggle" would drift toward the next-most-obvious thing — a double-click. The seed instead landed on *hold-to-commit with a dwell threshold* (DP1=0) and made the reverse *long-press to remove* (DP7=2), giving a symmetric hold-in / hold-out model where dwell duration is the confirm mechanism itself, not a separate button or dialog.
