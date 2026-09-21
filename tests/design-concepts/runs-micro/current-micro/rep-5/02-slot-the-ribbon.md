# Concept 02 — Slot the Ribbon

## Core idea
Saving is a tiny drag, not a click: you grab the bookmark glyph and drop it into
a shallow "shelf slot" that sits inside the button; on release it folds into the
slot like a paper ribbon tucking into a book, and a coral confirmation pill
slides out beside it.

## Key visual + interaction principles
- **Interaction model — drag-to-slot (not click-to-toggle).** The button holds
  two zones: the bookmark glyph at rest on the left, and an empty recessed slot
  on the right. You press the glyph and drag it rightward into the slot. Release
  past the slot's midpoint commits the save; release short springs the glyph
  back home (natural cancel — no accidental saves). A short drag distance
  (~28px) keeps it responsive for mouse and touch.
- **Motion primitive — fold / origami flip.** As the glyph enters the slot it
  folds along its vertical spine (scaleX → 0 then back with a flipped, filled
  face), reading as a ribbon creasing into a page. Duration ~180ms, the fold is
  the "commit" moment.
- **Feedback modality — color only.** No sound, no haptics. State is carried
  purely by fill and the coral pill. Quiet, accessible-by-default, works muted.
- **State cue — ribbon tail extends.** When saved, the folded glyph grows a
  short forked ribbon tail below the slot, so the resting saved state is legible
  at a glance without relying on fill alone.
- **Spatial anchor — pill beside the button.** A small coral pill ("Saved")
  slides out to the right of the button for ~1.4s then retracts. Confirmation
  lives next to the control, not on top of it, so it never hides the icon.
- **Un-save — hover reveals remove affordance.** Hovering a saved button fades
  a small ✕ over the slot; clicking it lifts the ribbon out and the glyph
  springs back home. On touch, a long-press surfaces the same ✕.
- **Palette — coral on deep navy.** Base surface `#0E1726` (deep navy), rest
  glyph `#6B7A90` (muted slate), slot recess `#1A2637`, saved fill + tail +
  pill `#FF6B5C` (coral), pill text `#0E1726`. Coral is reserved exclusively for
  the saved state so "saved" always means the same color.

## ASCII wireframe
```
REST (unsaved)                 DRAGGING (mid-slot)
+-----------------+            +-----------------+
|  ▶            . |            |     ...▶      . |   glyph dragged toward
|  ┃            . |            |        ┃      . |   the recessed slot ( . )
+-----------------+            +-----------------+
   grab the glyph                 past midpoint = commit

COMMIT (fold)                  SAVED (rest) + pill
+-----------------+            +-----------------+   +--------+
|            [|]  |            |            ◤    |   | Saved  |  <- coral pill
|            fold |            |            ╱╲   |   +--------+     slides out
+-----------------+            +-----------------+
   scaleX 1→0→1                    forked ribbon tail

SAVED + hover
+-----------------+
|            ✕    |   <- hover fades in ✕ over slot; click lifts ribbon out,
|            ╱╲   |      glyph springs home to REST
+-----------------+
```

## Seed-derived decisions
Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "B0++tJ8wcRt+PTrUR9EcwH3kqGR+grlC" 6 6 5 5 5 5 5
```
Output:
```
[2, 5, 0, 3, 2, 4, 4]
```

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 0 | interaction model (non-toggle) | 0 press-and-hold to fill · 1 double-click confirm · 2 drag glyph into a saved slot · 3 click arms 2s auto-commit countdown · 4 click + flick-up gesture · 5 click-to-arm then second click confirms | `B0++` | 2 | **2 drag glyph into a saved slot** |
| 1 | motion primitive | 0 radial wipe/fill · 1 outline→filled morph · 2 spring scale bounce · 3 liquid ink rise · 4 particle burst · 5 fold/origami flip | `tJ8w` | 5 | **5 fold/origami flip** |
| 2 | feedback modality | 0 color only · 1 color + haptic · 2 color + audio tick · 3 color + text label · 4 color + glyph swap | `cRt+` | 0 | **0 color only** |
| 3 | state cue for saved | 0 solid fill · 1 dot badge · 2 accent underline · 3 ribbon tail extends · 4 glow ring | `PTRU` | 3 | **3 ribbon tail extends** |
| 4 | spatial anchor of confirmation | 0 within button bounds · 1 tooltip above · 2 pill beside button · 3 ring around perimeter · 4 inline expand beyond width | `R9Ec` | 2 | **2 pill beside button** |
| 5 | un-save gesture | 0 repeat same interaction · 1 single quick-undo click · 2 shake/reverse · 3 undo pill with ✕ · 4 hover reveals remove affordance | `wH3k` | 4 | **4 hover reveals remove affordance** |
| 6 | palette mood | 0 amber/ink on cream · 1 teal on slate · 2 violet on near-black · 3 forest green on off-white · 4 coral on deep navy | `qGR+` | 4 | **4 coral on deep navy** |

## Why this diverges
- **From the default solution:** the default Save button is a single click that
  toggles a fill in place. Here the commit is a deliberate short *drag into a
  slot* — the physical act of "shelving" the item. This makes accidental saves
  nearly impossible (release-short cancels) while keeping the whole gesture under
  30px so it still feels instant.
- **From the assigned-axis baseline:** the axis says "diverge from single
  click-to-toggle." The obvious axis moves are press-and-hold or double-click
  (options 0/1). The seed landed on option 2, drag-to-slot, which is more
  spatial and self-canceling than either — the button carries a visible
  destination (the slot) rather than an invisible timer or hidden second click,
  so the affordance is discoverable at rest.
