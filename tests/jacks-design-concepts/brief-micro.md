# Test brief — micro-interaction / animation

Second brief for the suite, added to validate proposals #2 (split the axis
palette by brief type) and #3 (seed the axis subset). This is a single-element
motion brief — exactly the "button interactions/animations" trigger in the
skill description — where the layout-shaped palette is claimed to collapse.

**Brief:** The click-to-confirm interaction and animation for a single "Save"
(bookmark) icon button in a web app toolbar. A click saves the item; the button
must communicate pending → saved, allow un-saving, and feel responsive. One
button, one micro-interaction — no surrounding page layout is in scope.

**N:** 3.

**House style:** greenfield. Invent the palette.

## Two arms (the independent variable is which palette the territories come from)

The Phase A mechanism (the concept-agent template) is identical across arms.
Only the assigned axes differ, so this measures the palette, not the mechanism.

### Arm `current-micro` — territories from the current (layout-shaped) palette
The current skill offers one palette: spatial model, interaction model,
information density, motion language, metaphor, structural device. Picking 3
distinct, most-applicable axes for a single icon button yields:

| Concept | Axis | Instruction |
|---|---|---|
| 01 | Motion language | Diverge from the default instant color swap on click. |
| 02 | Interaction model | Diverge from the default single click-to-toggle. |
| 03 | Metaphor | Diverge from the default filled-vs-outline bookmark icon. |

### Arm `motion-palette` — territories from the proposed motion palette
The proposed per-brief motion palette offers motion primitive, feedback
modality, timing structure, trigger→response mapping, spatial anchor, state
cue, metaphor. Picking 3 distinct axes:

| Concept | Axis | Instruction |
|---|---|---|
| 01 | Motion primitive | Diverge from the default opacity/color tween (e.g. transform, physics-spring, morph, clip-reveal). |
| 02 | Feedback modality | Diverge from the default visual-only fill (e.g. shape-change, spatial displacement, faux-haptic micro-bounce). |
| 03 | Timing structure | Diverge from the default single-ease (e.g. staged sequence, overshoot-settle, interruptible-reversible). |
