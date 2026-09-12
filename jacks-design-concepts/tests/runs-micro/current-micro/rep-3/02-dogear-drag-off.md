# Concept 02 — Dog-Ear Drag-Off

## Core idea
A click folds a warm corner "dog-ear" onto the bookmark to save it; to un-save
you don't click again — you flick/drag the folded corner back off the button,
so committing and reverting are opposite physical gestures, not the same toggle.

## Key visual + interaction principles
- **Palette (greenfield, invented):**
  - Rest surface: `#EEF1F6` (cool paper-grey)
  - Rest icon stroke: `#5B6472` (cool slate)
  - Pending accent: `#7FA8FF` (cool blue — "committing")
  - Saved accent: `#F2A73B` (warm amber — the dog-ear fold + fill)
  - Undo text: `#8A94A6` (muted grey, low-priority)
- **Interaction (DP1 — drag-off to un-save):**
  1. Single click on the outline bookmark → save begins.
  2. During commit the icon runs a cool→warm color-temperature sweep (DP4):
     stroke shifts `#7FA8FF` → `#F2A73B` over ~180ms, signalling "landing."
  3. On settle, a corner dog-ear folds down over the top-right of the glyph
     (DP3) — the persistent, unmistakable "saved" state cue.
  4. To un-save: grab the folded corner and **drag/flick it off** the button
     (down-right, past a ~40% threshold). The fold peels away and the icon
     returns to the cool outline. A short click won't undo — the reverse
     action mirrors the physical fold.
- **Motion primitive (DP2 — elastic overshoot pop):** on save-commit the whole
  glyph does a springy scale pop (1.0 → 1.14 → 1.0, overshoot easing ~220ms)
  so the confirmation feels tactile and responsive even before the fold lands.
- **Spatial anchor (DP5 — ripple from click point):** feedback originates at
  the exact cursor/tap coordinate — a single warm ripple radiates outward from
  where you clicked, tying the amber fill to your own action rather than to the
  button center.
- **Undo affordance (DP6 — ephemeral "Undo" text):** immediately after save, a
  low-contrast "Undo" label fades in beside the button for ~2.5s then fades
  out. It's a shortcut, not the primary path; the primary un-save is the
  drag-off gesture, so the interface never depends on the toast persisting.
- **Responsiveness:** click is acknowledged optimistically at pointer-down
  (ripple + pop start instantly); the color sweep + fold play over the network
  round-trip. On failure the fold reverses with a small shake.
- **Accessibility:** the drag-off gesture has a keyboard/AT equivalent —
  `Enter` saves, `Shift+Enter` (or the focused "Undo") un-saves; `aria-pressed`
  reflects state, and color is never the sole cue (the dog-ear shape carries it).

## ASCII wireframe
```
 REST (unsaved)          PENDING (cool->warm)        SAVED (dog-ear folded)
 +-----------+           +-----------+                +-----------+
 |   ____    |           |   ____    |                |   ___/|   |   <- corner
 |  |    |   |           |  |::::|   |  sweep          |  |   /::| |      folded
 |  |    |   |   click   |  |::::|   |  #7FA8FF        |  |  /:::| |      (amber)
 |  |    |   |  ------->  |  |::::|   |  -> #F2A73B     |  | /::::| |
 |  |    |   |    ()<-ripple from     |    pop 1.14x    |  |/:::::| |
 |   \  /    |    click point         |                 |   \::::/  |
 +-----------+           +-----------+                +-----------+
   outline                 fill rising                 [ Undo ]  <- fades ~2.5s

 UN-SAVE:  grab folded corner, flick down-right past 40% -> fold peels off
     +-----------+          +-----------+
     |   ___/|   |          |   ____    |
     |  |   /:| ~~>drag      |  |    |   |   back to
     |  |  /:| /   ~~>       |  |    |   |   cool outline
     |  |_/__|/             |   \  /    |
     +-----------+          +-----------+
```

## Seed-derived decisions

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "1eivxZ0O91X0sjJbIP0Wo2O3VWbthGVw" 6 6 5 5 5 5
```
Output:
```
[1, 1, 2, 3, 3, 1]
```

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Interaction model (all non-default; not single click-to-toggle) | 0 press-and-hold to commit / 1 click-to-save + swipe-drag-off to unsave / 2 double-tap to confirm, tap-with-undo to unsave / 3 click-then-settle with cancel window / 4 tap-and-slide reveal to unsave / 5 long-press radial menu | `1eiv` | 1 | **1 click-to-save + drag-off to un-save** |
| 2 | Motion primitive | 0 outline→fill path morph / 1 elastic overshoot scale pop / 2 liquid fill rising / 3 particle burst / 4 ribbon unfurl / 5 ink stamp press | `xZ0O` | 1 | **1 elastic overshoot pop** |
| 3 | Persistent "saved" state cue | 0 solid fill swap / 1 extending ribbon tail / 2 corner dog-ear fold / 3 glow halo ring / 4 fill + check badge | `91X0` | 2 | **2 corner dog-ear fold** |
| 4 | Pending/commit feedback modality | 0 progress ring sweep / 1 pulsing opacity / 2 shake / 3 color-temperature shift cool→warm / 4 shrink-then-settle | `sjIb` | 3 | **3 cool→warm color shift** |
| 5 | Spatial anchor for feedback | 0 within button footprint / 1 toast above / 2 inline expanding pill / 3 ripple from click point / 4 floating tooltip | `IP0W` | 3 | **3 ripple from click point** |
| 6 | Undo affordance | 0 same button re-trigger / 1 ephemeral "Undo" text / 2 reverse-gesture only / 3 shake to unsave / 4 snackbar w/ undo | `o2O3` | 1 | **1 ephemeral "Undo" text** |

(Note: seed segments per the k→[4(k-1),4k) rule, DP1=chars[0:4]. Picks stand as
drawn; not reordered after seeing indices.)

## Why this diverges
- **From the default solution:** the default Save button is a single icon whose
  one click toggles fill on/off, confirmation living entirely inside the glyph.
  Here save and un-save are *different, direction-opposed physical actions* —
  click to fold on, drag to peel off — so the state is never accidentally
  flipped by a stray second click.
- **From the assigned-axis baseline (interaction model):** the obvious non-toggle
  move is press-and-hold (option 0). The seed instead selected the
  **asymmetric click-to-save / drag-off-to-unsave** model — commit is cheap and
  instant, reversal is deliberate and gestural, and the folded dog-ear is the
  literal handle you grab to undo. Feedback is anchored to the click point
  (ripple) and the commit reads as a cool→warm "cooling metal" temperature
  sweep rather than a spinner, keeping it distinct from any progress-ring norm.
