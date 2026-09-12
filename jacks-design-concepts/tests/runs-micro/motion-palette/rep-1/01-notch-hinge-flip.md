# Notch-Hinge Flip

## Core idea
A bookmark button that physically flips over — hinged at its own top notch —
to reveal a filled "saved" face, with a ribbon flag that unfurls downward and a
short haptic tick; the save is optimistic and un-flips itself if the server
rejects.

## Key visual + interaction principles
- **Two faces, one card.** Front = hollow bookmark outline (unsaved). Back =
  solid bookmark (saved). The button is a 3D card; clicking rotates it about a
  horizontal hinge line placed at the *top notch* of the bookmark, so it reads
  as the pennant tipping forward and dropping onto its back.
- **Optimistic by default.** The flip fires the instant you click — no spinner,
  no pending dim. The request runs in the background. On failure the card
  reverse-flips back to the outline face and the ribbon retracts (rollback is
  the only "pending" signaling the user ever sees).
- **Ribbon confirms the committed state.** Once landed on the saved face, a thin
  ribbon flag extends downward a few px from the notch and holds — a persistent,
  glanceable cue that survives after motion settles (not just a momentary color
  flash).
- **Haptic + visual pairing.** A single 10ms haptic tick (`navigator.vibrate`,
  no-op where unsupported) fires at the moment the flip crosses 90° and the back
  face becomes visible, so touch and sight confirm together.
- **Un-save = click again.** A second click runs the reverse flip (saved → back
  to outline) and retracts the ribbon. Same target, no separate X, no long-press.
- **Motion, not fade.** Divergence axis honored: the state change is a
  `rotateX` transform of a two-faced card (`transform-style: preserve-3d`,
  `backface-visibility: hidden`), hinged via `transform-origin: top`. No opacity
  or color cross-fade carries the state.

### Invented palette (greenfield)
- Surface / rest outline: slate `#3A4256` on paper `#F5F3EC`
- Saved face fill + ribbon: warm amber `#E0872E`
- Hinge shadow accent (during flip): `#1F2433` at 18% alpha

## ASCII wireframe

```
 UNSAVED (front face)          MID-FLIP (~90°, hinge at notch)      SAVED (back face)
                                     _____                            _______
     _______                        |     |   <- hinge line           |█████|
    |   ∧   |                        |─────|      (top notch)          |██∧██|
    |  / \  |   click ──►            :     :        + haptic  ──►      |█████|
    |  | |  |                        :.....:                           |██║██|   ribbon
    |  |_|  |                          ‾‾                              |█████|   extends
    |_______|                                                          |██▼██|   below notch
     outline                       card rotating on X               solid + flag

 second click on SAVED ──► reverse rotateX ──► back to UNSAVED, ribbon retracts
 save request fails      ──► auto reverse-flip + ribbon retract (rollback)
```

## Seed-derived decisions

Seed: `mXxk08ZguJjsntylneysQ8B8/uuM2niR`

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 0 | Motion primitive (axis: NOT opacity/color tween) | 0=transform scale-pop · 1=physics spring overshoot · 2=path morph outline→fill · 3=clip-path fill reveal · 4=3D card flip | `mXxk` | 4 | **4 = 3D card flip** |
| 1 | Feedback modality | 0=visual only · 1=haptic + visual · 2=audio tick + visual · 3=particle burst + visual | `08Zg` | 1 | **1 = haptic + visual** |
| 2 | Saved-state cue (persistent) | 0=outline→solid fill only · 1=badge dot · 2=ribbon flag extends · 3=checkmark overlay · 4=stroke thickening | `uJjs` | 2 | **2 = ribbon flag extends** |
| 3 | Spatial anchor / motion origin | 0=icon geometric center · 1=cursor click point · 2=bottom edge · 3=top notch of bookmark | `ntyl` | 3 | **3 = top notch of bookmark** |
| 4 | Un-save affordance | 0=long-press to remove · 1=hover-reveal X · 2=swipe-off · 3=second click reverse-flip | `neys` | 3 | **3 = second click reverse-flip** |
| 5 | Pending indicator | 0=spinner ring · 1=progress fill sweep · 2=pulsing skeleton · 3=optimistic, rollback on fail | `Q8B8` | 3 | **3 = optimistic, rollback on fail** |

Command run:

```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "mXxk08ZguJjsntylneysQ8B8/uuM2niR" 5 4 5 4 4 4
```

Output:

```
[4, 1, 2, 3, 3, 3]
```

## Why this diverges from the default and from the assigned-axis baseline
- **From the generic default:** the typical Save button cross-fades a filled
  color in and flips a boolean class — an opacity/color tween with a spinner for
  pending. This concept carries the entire state change on a 3D geometric
  transform, uses an optimistic model that removes the spinner entirely, and
  confirms with touch (haptic) plus a persistent ribbon rather than a momentary
  color change.
- **From the assigned-axis baseline (motion primitive):** the obvious non-default
  motion pick is a scale-pop or spring bounce (options 0/1). The seed landed on a
  true two-faced 3D card flip (option 4) hinged specifically at the bookmark's
  top notch (DP3=3) rather than its center — so the pennant tips over its own
  point, a materially different mechanic than a pop that just re-emphasizes the
  same face.
