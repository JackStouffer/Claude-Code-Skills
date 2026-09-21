# Sluicegate

## Core idea
Saving is a two-step "open the gate" gesture: the first click drops a small
confirm gate down over the bookmark from the top edge; clicking that gate
opens the sluice and liquid floods up to fill the icon, which settles as a
pinned ribbon. Un-saving repeats the same two-step to drain it.

## Key visual + interaction principles
- **Two-step commit, not a toggle.** Click 1 *arms* — a confirm gate descends
  from the top edge and rests over the button. Click 2 lands on that gate and
  *commits* the save. A single stray click never saves; clicking anywhere
  else (or pressing Esc) retracts the gate back up and cancels.
- **Liquid fill-sweep.** On commit, color floods upward inside the bookmark
  outline like water behind an opened sluice — the fill level *is* the
  progress. Anchored to the top edge: the gate drops from the top, the fill
  rises to meet where it sat.
- **Indeterminate shimmer = pending.** While the save request is in flight,
  the risen liquid carries a slow left-to-right shimmer band. No spinner, no
  percentage — the shimmer means "in flight," a steady solid fill means done.
- **Ribbon as the persistent saved cue.** Once confirmed, the filled bookmark
  keeps a thin ribbon tab pinned to the button's top edge (where the gate came
  from) so the saved state reads at a glance without color alone.
- **Pure visual feedback.** No haptics, no sound. The gate, the flood, the
  shimmer, and the ribbon carry the whole story.
- **Un-save = same gesture.** On a saved button, click 1 drops the gate again;
  click 2 opens the sluice the other way and the liquid *drains* back down,
  the ribbon unpins. Reversal is learned once and reused.
- Palette (greenfield): ink `#12303B` outline, `#1C6E8C` liquid,
  `#3FB6C4` shimmer highlight, `#F2C14E` ribbon accent, `#EEF4F5` empty ground.

## ASCII wireframe

```
IDLE (armed=false, saved=false)          STEP 1 — click arms: gate drops in
  ┌──────┐                                 ┌──────┐
  │  ▽    │   outline bookmark              │ �$===$│  <- confirm gate slid
  │ │  │  │   (empty ground)                │ │  │ │     down from top edge
  │ │  │  │                                 │ │  │ │     ("click to confirm")
  │ └──┘  │                                 │ └──┘ │
  └──────┘                                  └──────┘
        click                                     click the GATE  (Esc / click
                                                   elsewhere = gate retracts up)

STEP 2 — sluice opens, liquid floods up      PENDING — shimmer band in fill
  ┌──────┐                                    ┌──────┐
  │ │  │  │   fill rising ▲                   │▓▒░▓▒░│  <- shimmer sweeps L→R
  │ │▁▁│  │                                   │▓▒░▓▒░│     while request flies
  │ ▟▙▟▙  │                                   │ ▟▙▟▙ │
  └──────┘                                    └──────┘

SAVED (steady fill + pinned ribbon)         UN-SAVE — same 2 steps, drains down
  ┌──╤═══┐   ribbon pinned to top edge        ┌──────┐
  │██│███│   solid liquid, no shimmer         │ │  │ │   fill draining ▼
  │██│███│                                    │ │▔▔│ │   ribbon unpinning
  │ ███  │                                    │ └──┘ │
  └──────┘                                    └──────┘
```

## Seed-derived decisions

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "2qp4FfLLn0tudGpQ8WgpI0OFCmwIXowd" 6 6 5 5 5 5 5
```
Output:
```
[3, 0, 1, 4, 3, 0, 3]
```

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | interaction model (assigned axis) | 0 press-and-hold to save / 1 double-tap / 2 click-then-drag to shelf / 3 click arms + second click on revealed confirm target commits (two-step) / 4 long-press radial fill then release / 5 swipe-flick upward | `2qp4` | 3 | **3 two-step arm-then-confirm** |
| 2 | motion primitive | 0 liquid fill-sweep / 1 outline→filled morph / 2 particle burst / 3 elastic bounce/overshoot / 4 fold/origami tuck / 5 spring stretch | `FfLL` | 0 | **0 liquid fill-sweep** |
| 3 | persistent "saved" state cue | 0 filled glyph + color shift / 1 pinned ribbon/tab / 2 corner dog-ear fold / 3 badge dot / 4 anchor bar | `n0tu` | 1 | **1 pinned ribbon/tab** |
| 4 | feedback modality (beyond visual) | 0 haptic pulse / 1 audio tick / 2 ripple + haptic / 3 text micro-label toast / 4 none (pure visual) | `dGpQ` | 4 | **4 none (pure visual)** |
| 5 | spatial anchor of the animation | 0 in-place within bounds / 1 docks to a shelf elsewhere / 2 emanates from cursor point / 3 drops from top edge / 4 anchored to bottom baseline | `8Wgp` | 3 | **3 drops from top edge** |
| 6 | un-save affordance | 0 same gesture repeated / 1 reverse gesture (opposite direction) / 2 hold again to drain / 3 tap the persistent state cue / 4 shake gesture | `I0OF` | 0 | **0 same gesture repeated** |
| 7 | pending-state representation | 0 progress ring / 1 pulsing dim glyph / 2 skeleton/ghost fill / 3 indeterminate shimmer / 4 dot loader | `Cmwn`* | 3 | **3 indeterminate shimmer** |

\* DP7 uses seed chars [24,28) of `2qp4FfLLn0tudGpQ8WgpI0OFCmwIXowd` = `Cmwn`.

## Why this diverges

**From the default solution.** The obvious Save button is one click that
instantly toggles filled/unfilled with a quick color change. Sluicegate is
built on the seed-forced combination instead: a *two-step* commit (DP1=3), so
a single click can never save — it only arms a gate that must itself be
clicked. That removes the accidental-save failure mode entirely and makes the
commit deliberate.

**From the assigned-axis baseline.** The axis is "diverge from single
click-to-toggle." The lazy way to satisfy that axis is a press-and-hold
(DP1 option 0) or double-tap (option 1) — the first things anyone reaches for.
The seed landed on option 3, a revealed confirm target, which is a genuinely
different interaction shape: the button spawns a second, distinct hit-target
(the dropped gate) that carries the confirmation, rather than overloading
timing or repetition on the same target. Combined with the top-edge anchor
(DP5=3) the gate and the rising liquid fill (DP2=0) share one physical
metaphor — a sluice — and un-save reuses the exact same two-step (DP6=0), so
the whole interaction is one learnable gesture in both directions, with
purely visual feedback (DP4=4) and an indeterminate shimmer (DP7=3) covering
the network-pending gap.
