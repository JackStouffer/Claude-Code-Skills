# Flick-to-Shelf

## Core idea
Saving is a gesture, not a toggle: you grab the bookmark icon and flick it a
few pixels toward a shelf-slot that opens beneath the button; on release it
snaps home with an elastic pop and a "Saved" label slides out from the exact
point you let go. Un-saving is the reverse flick back out.

## Key visual + interaction principles
- **Input = short drag/flick, not a click.** Press the icon, nudge it toward
  the slot; a release past a small threshold commits the save, a release short
  of it springs the icon back with no change. This makes save a deliberate,
  reversible physical act and kills accidental one-click saves.
- **Commit motion = elastic overshoot.** On commit the icon scales down into
  the slot then pops back with a spring overshoot (transform: scale 0.82 ->
  1.12 -> 1.0), so "landed" is felt, not just seen.
- **Confirmation modality = a sliding micro-label.** A small "Saved" chip
  slides out horizontally from the release point and fades after ~1.2s. On
  un-save the chip reads "Removed".
- **Persistent saved-state cue = a small dot/badge.** A 4px emerald dot sits at
  the top-right notch of the bookmark while saved; empty state has no dot. This
  survives after the label fades, so state is unambiguous at a glance.
- **Spatial anchor = the release point.** Motion, label, and the little
  travel-trail all emanate from wherever your pointer let go, not from a fixed
  icon center — the feedback follows your hand.
- **Palette = emerald on charcoal.** Base icon `#8A93A0` (muted slate) on a
  `#16181D` toolbar; saved accent + dot `#22C55E` emerald; label chip
  `#1E2228` bg with emerald text. Focus ring `#22C55E` at 40% for keyboard.
- **Accessibility:** keyboard users get a non-gesture path — Enter/Space arms,
  a second Enter within 2s commits (mirrors the flick's two-phase intent);
  `aria-pressed` reflects saved state; label announced via `aria-live`.
  Honors `prefers-reduced-motion` by dropping the overshoot to a plain fade.

## ASCII wireframe
```
Toolbar (charcoal #16181D)
┌───────────────────────────────────────────────┐
│   ⌫    ⤢    [ ▯ ]    ⋯                          │
│              ^bookmark icon (idle, slate)       │
└───────────────────────────────────────────────┘

(1) press + flick down-right           (2) release past threshold → commit
      [ ▯]                                     [ ▯•]  ◄ emerald dot appears
        \  drag                                  ⤺ elastic pop back to home
         ┌───┐  shelf-slot opens               ┌──────────┐
         │ ▽ │  (drop target)                  │  Saved   │ ← chip slides
         └───┘                                 └──────────┘   out from
                                                              release point

idle:  [ ▯ ]   (no dot)      saved:  [ ▯• ]  (emerald dot, top-right notch)
un-save: grab the saved icon, flick back OUT of the slot → dot clears,
         chip slides out reading "Removed".
```

## Seed-derived decisions
Seed: `fNFLJA3pq+Z/vJx1sxKrEWEWZhbpaadw`

Decision point 0 is my fixed axis (interaction model); every candidate below
already diverges from the default single click-to-toggle, so it is rolled
fairly among divergent options rather than defaulted.

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Interaction model (axis) | 0=press-and-hold to commit, 1=double-click, 2=flick/drag into a saved slot, 3=two-stage arm-then-confirm click, 4=instant save + timed undo lock, 5=scrub/swipe across icon | `fNFL` | 326 % 6 = **2** | flick/drag into a saved slot |
| 2 | Commit motion primitive | 0=fill sweep, 1=shape morph to check, 2=elastic pop/overshoot scale, 3=ribbon unfurl, 4=radial ink flood | `JA3p` | 302 % 5 = **2** | elastic pop/overshoot scale |
| 3 | Confirmation modality | 0=pure motion, 1=color shift only, 2=haptic-style pulse ring, 3=sliding micro-label, 4=particle burst | `q+Z/` | 293 % 5 = **3** | sliding micro-label ("Saved") |
| 4 | Persistent saved-state cue | 0=solid fill vs outline, 1=small dot/badge, 2=underline/accent bar, 3=color-only hue | `vJx1` | 361 % 4 = **1** | small dot/badge |
| 5 | Palette accent | 0=amber/gold on ink, 1=teal/mint on slate, 2=coral on cream, 3=indigo on off-white, 4=emerald on charcoal | `sxKr` | 424 % 5 = **4** | emerald on charcoal |
| 6 | Spatial anchor of feedback | 0=from release/click point outward, 1=from icon center, 2=from bottom edge, 3=from top | `EWEW` | 312 % 4 = **0** | from release point outward |

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "fNFLJA3pq+Z/vJx1sxKrEWEWZhbpaadw" 6 5 5 4 5 4
```
Output:
```
[2, 2, 3, 1, 4, 0]
```

## Why this diverges
**From the default solution:** the default is a single click that toggles a
filled/outline bookmark in place. Here the primitive is a *gesture with a
commit threshold* — a short flick into a slot that opens on press — so save is
a deliberate, spatial, reversible act with real physics rather than a binary
in-place tap.

**From the assigned-axis baseline:** the obvious non-toggle interaction model
is press-and-hold (option 0). The seed landed on flick/drag-into-a-slot
(option 2) instead, which is a genuinely different mental model: the item is
"shelved" into a target rather than charged up in place, and un-saving is the
literal inverse gesture (flick back out) rather than a second identical action.
The feedback stack reinforces the physicality — motion, label, and travel-trail
all originate from the release point, and a persistent emerald dot carries the
state after the transient chip fades.
