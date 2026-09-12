# Notch-Snap Ribbon

## Core idea
A bookmark-shaped Save button whose outline **morphs into a solid ribbon** and
**elastically over-snaps then double-settles** from its top notch, as if the
ribbon were pinched at the notch and released. Saved state reveals a small
"Saved" label; un-saving is a hover-revealed remove control.

## Palette (invented — greenfield)
- Rest (unsaved): `#5B6472` outline on transparent, 1.75px stroke
- Ink / fill (saved): `#E8B23A` (warm amber ribbon)
- Glow accent: `#F6D888` at 35% (soft halo, saved only)
- Label text: `#2A2F38` on the button's own surface
- Surface / toolbar: `#F4F3EF`
- Remove-x on hover: `#B34733`

## Key visual + interaction principles
- **One physical metaphor:** the top notch of the bookmark is the anchor. All
  motion (the pinch, the snap, the bounce) radiates from that notch, not the
  icon's centroid — so the shape reads as being grabbed by its tab.
- **Morph, not swap:** the unfilled outline path animates into the filled
  ribbon path (stroke collapses inward as fill floods). No cross-fade between
  two glyphs.
- **Elastic snap + secondary bounce timing (assigned axis):** on click the
  ribbon over-shoots ~112% along its vertical axis from the notch, snaps back
  past rest to ~96%, then a smaller secondary bounce to 100%. Two decaying
  overshoots, not one ease. Total ~380ms; the first overshoot lands at ~90ms so
  the click still feels instant.
- **Feedback = haptic + subtle glow:** on the snap-settle, a single haptic tap
  (`navigator.vibrate(8)` where supported) fires and the `#F6D888` halo blooms
  up during the bounce, then holds dim while saved. No particle spray, no ring.
- **Pending:** during the async save the notch "holds" the ribbon at ~108%
  (stretched, desaturated amber) — the bounce-settle only resolves once the
  server confirms, so the settle *is* the success signal. Failure snaps the
  ribbon back to outline with a short shake.
- **Saved resting cue:** filled amber ribbon **plus a "Saved" text label** that
  slides in beside the icon on settle and persists.
- **Un-save:** hovering a saved button reveals a small `×` remove affordance
  over the notch; clicking it reverses the morph (fill drains toward the notch,
  ribbon relaxes to outline) and clears the label.

## ASCII wireframe

```
 UNSAVED (rest)              PENDING (held at notch)       SAVED (settled)
 ┌───────┐                   ┌───────┐                     ┌───────┐  Saved
 │  ╱╲   │                   │  ╱╲   │  <- notch pinch     │  ╱▇╲  │  ◀ label
 │ │  │  │  outline          │ │▓▓│  │  stretched          │ │▇▇│  │  slid in
 │ │  │  │  #5B6472          │ │▓▓│  │  108%, desat        │ │▇▇│  │  amber fill
 │ │  │  │                   │ │▓▓│  │                     │ │▇▇│  │  #E8B23A
 │ ╲__╱  │                   │ ╲▓▓╱  │                     │ ╲▇▇╱ ·│  · = glow
 └───────┘                   └───────┘                     └───────┘

 SNAP TIMING (vertical scale from notch, click -> settle):
   112% ┐   over-shoot
        │ ╭─╮
   100% ┤╱   ╰╮      ╭─── settle
        │     ╰─╮  ╭╯   secondary bounce
    96% ┤       ╰──╯
        └──┬────┬────┬────┬──►  ~380ms total
          0ms  90   210  380

 SAVED + HOVER (un-save affordance):
   ┌───────┐
   │  ╱✕╲  │   ✕ appears over notch (#B34733)
   │ │▇▇│  │   click -> fill drains toward notch, relax to outline
   │ ╲▇▇╱  │
   └───────┘
```

## Seed-derived decisions

Seed: `F7SorQ5i1tmrfLMhJMkIFBfseKxOo2Ll`

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|---|---|---|---|---|
| 0 | Timing structure (assigned axis) | 0 staged sequence · 1 overshoot-settle · 2 interruptible-reversible · 3 anticipation wind-up · 4 elastic snap + secondary bounce | `F7So` | 4 | **elastic snap + secondary bounce** |
| 1 | Motion primitive (what moves) | 0 fill sweep bottom-up · 1 scale pulse · 2 flip/rotate · 3 outline→filled path morph · 4 ribbon drop-in | `rQ5i` | 3 | **outline→filled path morph** |
| 2 | Feedback modality (beyond shape) | 0 color shift · 1 particle burst · 2 ring ripple · 3 haptic + subtle glow · 4 stroke-weight change | `1tmr` | 3 | **haptic + subtle glow** |
| 3 | Saved resting cue | 0 solid fill + accent · 1 fill + check badge · 2 fill + persistent glow · 3 fill + label text | `fLMh` | 3 | **fill + label text** |
| 4 | Spatial anchor (motion origin) | 0 icon center · 1 bottom edge · 2 click point · 3 bookmark top notch | `JMkI` | 3 | **bookmark top notch** |
| 5 | Un-save affordance | 0 same button toggles reverse · 1 hover reveals remove-× · 2 long-press · 3 click drains fill | `FBfs` | 1 | **hover reveals remove-×** |

Command run:

```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "F7SorQ5i1tmrfLMhJMkIFBfseKxOo2Ll" 5 5 5 4 4 4
```

Output:

```
[4, 3, 3, 3, 3, 1]
```

## Why this diverges

**From the default solution:** the obvious Save micro-interaction is a glyph
swap (outline ↔ filled) with one ease-out and maybe a color change. This concept
never swaps glyphs (it morphs the path), never uses a single ease, and makes the
*success confirmation* the physical settle of a bounce rather than an instant
recolor.

**From the assigned-axis baseline:** the axis asks only to leave single-ease
behind. The cheap version of that is one overshoot-settle (index 1). The seed
landed on index 4 — a **double** decaying overshoot anchored at the notch — and
that stands. It also ties timing to state: the pending phase deliberately
*withholds* the settle-bounce until the server confirms, so the two-stage bounce
carries the pending→saved meaning instead of being pure decoration.
