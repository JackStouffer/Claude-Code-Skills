# Ink Flood Bookmark

## Core idea
A bookmark that saves by filling with ink from its base up — and the fill level
is a live, interruptible tween tied to saved-state, so a click mid-animation
reverses the pour instead of queuing a second beat. Un-saving drains the ink
back down the same channel.

## Key visual + interaction principles
- **Primitive: liquid fill.** The bookmark outline is a container; teal "ink"
  rises inside it from the baseline to fill the silhouette. Not a scale pulse,
  not a swap — a level that moves.
- **Timing: interruptible-reversible (no fixed duration).** There is one state
  variable, `fill` in [0,1], driven toward its target by a critically-damped
  tween. Clicking flips the target (0↔1). If you click while ink is at 0.6 on
  the way up, the target becomes 0 and the ink drains from 0.6 — it never
  snaps, never finishes an animation you've already cancelled. Responsiveness
  comes from acting on the *current* level, not a locked keyframe track.
- **Feedback: pure visual (color + shape only).** No haptic, no sound, no
  ripple. The state lives entirely in fill height + hue.
- **Saved cue: filled bookmark silhouette.** fill = 1 is the resting saved
  state; the whole mark reads solid teal. fill = 0 is a bare stone outline.
- **Spatial anchor: the icon baseline.** Ink enters and leaves at the bottom
  edge of the glyph; a subtle 1px meniscus highlight rides the top of the fill
  so the "surface" of the liquid is legible even at partial levels.
- **Reversal: drain.** Un-save is not a separate animation — the same tween
  runs toward 0 and the ink recedes down and out the baseline.

Palette (greenfield / invented):
- Paper background `#F4F1EA`
- Idle outline / empty stroke `#8A8578`
- Ink fill `#1E8E7E`, meniscus highlight `#34B7A4`
- Settled saved solid `#147567`
- Focus ring `#B98A3C`

## ASCII wireframe

```
 idle (fill 0)      pouring (fill ~.6)   saved (fill 1)      draining (un-save)
 ┌──────────┐       ┌──────────┐         ┌──────────┐        ┌──────────┐
 │   ▟▙     │       │   ▟▙     │         │   ▟▙     │        │   ▟▙     │
 │  ▐  ▌    │       │  ▐  ▌    │         │  ▐██▌    │        │  ▐  ▌    │
 │  ▐  ▌    │       │  ▐██▌    │meniscus │  ▐██▌    │        │  ▐  ▌    │
 │  ▐  ▌    │       │  ▐██▌    │←≈≈≈     │  ▐██▌    │        │  ▐██▌    │← level
 │  ▐▁▁▌    │       │  ▐██▌    │         │  ▐██▌    │        │  ▐██▌    │  falling
 └──────────┘       └──────────┘         └──────────┘        └──────────┘
   stone #8A8578      ink rising           solid #147567       ink receding
                      #1E8E7E                                   out baseline

  click ─────────────► target flips to 1 (pour)
  click during pour ─► target flips to 0, drain from wherever the level is now
```

Interaction timeline (one variable, no fixed length):
```
fill  1 ┤                 ╭──────── (settle, saved)
        │            ╭────╯
     .5 ┤        ╭──╯  ← 2nd click here: target→0
        │    ╭──╯      ╰──╮
      0 ┼───╯             ╰────────── (drained, unsaved)
        └── click ───── click ─────►  time
```

## Seed-derived decisions

Seed: `XD1CXF5GcbX+qDWpXGW4dt5HIoQuQFkg`

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Motion primitive | 0 scale-pulse · 1 flip/rotate · 2 liquid-fill · 3 outline→solid path morph · 4 two-icon slide-swap | `XD1C` | 2 | **liquid-fill** |
| 2 | Timing structure (assigned axis) | 0 staged discrete steps · 1 overshoot-settle spring · 2 interruptible-reversible scrub · 3 elastic decay · 4 anticipation-then-release | `XF5G` | 2 | **interruptible-reversible** |
| 3 | Feedback modality | 0 pure visual (color+shape) · 1 color+ripple · 2 color+haptic · 3 color+audio tick | `cbX+` | 0 | **pure visual** |
| 4 | Saved-state cue | 0 filled silhouette · 1 checkmark overlay · 2 color-only swap · 3 added badge/dot · 4 label text | `qDWp` | 0 | **filled silhouette** |
| 5 | Spatial anchor | 0 button center · 1 icon geometric origin · 2 icon baseline (bottom edge) · 3 toolbar edge | `XGW4` | 2 | **icon baseline** |
| 6 | Reversal treatment | 0 reverse same anim · 1 drain/empty · 2 cross-fade to outline · 3 shrink-out | `dt5H` | 1 | **drain/empty** |

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "XD1CXF5GcbX+qDWpXGW4dt5HIoQuQFkg" 5 5 4 5 4 4
```
Output:
```
[2, 2, 0, 0, 2, 1]
```

## Why this diverges

**From the default solution.** The obvious Save button is an outline bookmark
that snaps to a solid filled bookmark on click, maybe with a small color change
or a one-shot scale bounce. Here the primitive is a *fill level*, not a
swap: the icon is a vessel that fills and empties, giving continuous partial
states a boolean toggle never shows.

**From the assigned-axis baseline (timing structure).** The baseline timing is
single-ease: one click launches one fixed-length curve that must play out. The
seed put me on **interruptible-reversible**, which I took literally — there is
no keyframe track and no duration. State is a single `fill` value chased by a
damped tween toward a target the click flips. A second click doesn't queue or
restart; it re-aims the same in-flight motion, so save→un-save→save spam stays
glued to the pointer and always resolves to the true current state. That is the
opposite of a locked ease, and it's what makes rapid toggling feel responsive
instead of laggy or double-buffered.
