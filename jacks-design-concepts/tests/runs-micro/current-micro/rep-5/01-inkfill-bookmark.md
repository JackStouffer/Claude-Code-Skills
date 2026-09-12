# Concept: Inkfill Bookmark

## Core idea
On click, the bookmark outline is *drawn on* stroke-by-stroke like a pen tracing it, then floods with ink from the top notch downward — the drawing motion itself is the confirmation, paired with a soft "click-set" audio cue.

## Palette (greenfield)
- Canvas / toolbar: `#12141A` (near-black slate)
- Idle stroke: `#6B7280` (cool grey)
- Ink accent (saved): `#E8B23A` (amber)
- Ink highlight edge: `#FFD97A`
- Label text: `#E8B23A` on `#1C1F27` pill

## Key visual + interaction principles
- **Draw-on primitive:** the bookmark is an SVG path. Idle = full grey outline. On click the outline redraws via `stroke-dashoffset` (≈220 ms) as if a pen retraces it, *then* amber ink fills.
- **Fill anchored at the top notch, flowing down:** the fill mask sweeps from the bookmark's top opening toward the pointed tip (≈180 ms), so the glyph reads as being filled from where a real ribbon enters.
- **Pending = ghost shimmer:** while the save request is in flight, the glyph shows a low-opacity skeleton of itself with a left-to-right shimmer sweep. Motion runs optimistically on click; if the request fails the ink drains back up and the shimmer stops.
- **Saved rest state = filled glyph + "Saved" label:** amber-filled bookmark with a small `Saved` text pill sliding in beside it. Unambiguous at rest, no reliance on color memory.
- **Audio modality:** a short, quiet "ink-set" tick fires at the moment the fill completes (respects `prefers-reduced-motion` / muted — silent fallback, motion still plays).
- **Un-save = long-press:** a deliberate ~450 ms press drains the ink back up to the notch, retracts the label, and returns to grey outline. A quick tap does *not* un-save (prevents accidental removal); a ring progress cue traces the press so the user sees the hold register.
- Reduced-motion: skip the draw/fill tween, cross-fade outline→filled + label, no audio.

## ASCII wireframe

```
IDLE                 PENDING (ghost shimmer)     DRAW-ON  ->  INK FILL (top->tip)
 ┌───────────┐        ┌───────────┐               ┌───────────┐   ┌───────────┐
 │   ▁▁▁▁▁   │        │   ░▒▓▒░   │  <-shimmer     │   ┌───┐   │   │   ▓▓▓▓▓   │  <-fill
 │  │     │  │        │  ░     ░  │     sweep      │   │pen│   │   │  ▓▓▓▓▓▓▓  │    from
 │  │     │  │        │  ░     ░  │                │   │ │ │→  │   │  ▓▓▓▓▓▓▓  │    notch
 │  │     │  │        │  ░     ░  │                │   └─┼─┘   │   │  ▓▓▓▓▓▓▓  │    down
 │   \   /   │        │   ░   ░   │                │    \ /    │   │   ▓▓▓▓▓   │
 │    \ /    │        │    ░ ░    │                │     V     │   │    ▓▓▓    │
 │     V     │        │     V     │                │           │   │     V     │
 └───────────┘        └───────────┘               └───────────┘   └───────────┘
 grey outline         request in flight            ~220ms          ~180ms  *tick*

SAVED (rest)                         LONG-PRESS TO UN-SAVE
 ┌───────────────────────┐           ┌───────────────────────┐
 │   ▓▓▓▓▓   ╭─────────╮  │           │   ▓▒░░▒   ╭─────────╮  │  ink drains UP,
 │  ▓▓▓▓▓▓▓  │  Saved  │  │           │  ▒░   ░▒  │ (•450ms)│  │  ring traces hold
 │  ▓▓▓▓▓▓▓  ╰─────────╯  │           │  ░     ░  ╰────◜────╯  │  release early = stays saved
 │   ▓▓▓▓▓                │           │   ░   ░               │
 │    ▓▓▓                 │           │    ░ ░                 │
 └───────────────────────┘           └───────────────────────┘
```

## Seed-derived decisions

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Motion primitive | 0 fill-rise liquid · 1 origami Y-flip · 2 elastic scale pop · 3 draw-on stroke then fill · 4 ribbon unfurl · 5 outline→filled shape morph | `1Ti5` | 3 | **3 draw-on stroke then fill** |
| 2 | Feedback modality | 0 motion only · 1 motion + micro-shake · 2 motion + color shift · 3 motion + ripple emanation · 4 motion + audio cue | `OZRq` | 4 | **4 motion + audio cue** |
| 3 | Pending-state cue | 0 progress arc · 1 dashed pulsing outline · 2 skeleton/ghost shimmer · 3 dot-trail loader · 4 dim + spin | `BAwk` | 2 | **2 skeleton/ghost shimmer** |
| 4 | Saved persistent cue | 0 filled + accent color · 1 filled + check badge · 2 filled + glow halo · 3 filled + "Saved" label · 4 filled + underline tick | `P/82` | 3 | **3 filled + "Saved" label** |
| 5 | Un-save affordance | 0 click toggles reverse · 1 long-press to remove · 2 hover reveal "x" · 3 click + confirm tooltip | `K0aI` | 1 | **1 long-press to remove** |
| 6 | Spatial anchor | 0 center outward · 1 bottom edge up · 2 top notch downward · 3 cursor origin · 4 toolbar baseline | `anAZ` | 2 | **2 top notch downward** |

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "1Ti5OZRqBAwkP/82K0aIanAZwLScbOqR" 6 5 5 5 4 5
```
Output:
```
[3, 4, 2, 3, 1, 2]
```

## Why this diverges

**From the default solution:** the default Save button does an instant color swap (grey → filled/accent) on click. This concept never swaps color instantly — the confirmation is a temporal *drawing* gesture (pen retrace, then directional ink flood) plus an audio tick, so state change is felt as an event, not a flat repaint.

**From the assigned-axis baseline (motion language):** the obvious "diverge from instant swap" move is a scale/pop or a simple fade. The seed instead landed on a **draw-on stroke primitive anchored at the top notch flowing downward** — a two-phase trace-then-fill motion with a real spatial origin, which is a more specific and less templated motion vocabulary than a generic bounce. Reinforcing choices that are non-default: pending is a **ghost shimmer** (not a spinner), the rest state carries an explicit **"Saved" label** rather than relying on color alone, and un-saving requires a **deliberate long-press**, which pairs naturally with a motion-heavy confirm by protecting the expensive-looking animation from accidental toggles.
