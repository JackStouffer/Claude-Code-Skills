# Recoil Tap

## Core idea
A Save button that behaves like a spring-loaded stamp: press builds visible tension, release fires an inertial flick that punches the bookmark into place with a faux-haptic micro-bounce — no color-fill needed to know it landed.

## Key visual + interaction principles
- **Feedback is kinetic, not chromatic.** The confirmation signal is a bounce you feel through your eyes: the whole button recoils and settles, mimicking a physical detent. Fill/hue barely moves; motion carries the message.
- **Tension build on press.** While the pointer is held, the icon compresses slightly toward center and a faint "loading tension" is implied (the icon draws in on itself). Release triggers the commit — this gives an inherent pending -> saved arc even on a fast local save.
- **Inertial flick from center.** On release the bookmark scales up past its resting size (overshoot), then whips back and micro-bounces to a settled saved state that is visibly *larger/denser* than the unsaved outline.
- **State cue = size.** Unsaved is a thin, slightly smaller outline bookmark. Saved is a heavier, larger filled-weight glyph. You can read state from across the room by silhouette scale alone, independent of color.
- **Un-save = shake it off.** Clicking a saved button plays an eject: the icon does a quick lateral shudder (2-3 oscillations) as if flicking the bookmark out, shrinking back to the unsaved outline size.
- **Responsiveness.** The recoil starts on pointerup within one frame (optimistic); network confirmation, if any, only cancels/reverts on failure. Reduced-motion users get a size snap with no oscillation.

### Palette (invented, greenfield)
- Surface: `#12141A` (near-black slate toolbar)
- Idle icon: `#7C8598` (muted steel outline)
- Active/saved icon: `#F2C14E` (warm amber, weight not hue does the talking)
- Recoil highlight ring (1 frame): `#FFFFFF` at 12% opacity

## ASCII wireframe

```
IDLE (unsaved, small outline)        PRESS (tension: drawn inward)
 ┌───────┐                            ┌───────┐
 │  ⌐╗    │   thin steel outline       │  ▟▙    │  compressed toward center
 │   ║    │   scale 0.92               │  ▐▌    │  scale 0.86, "loading"
 │  ⌐╝    │                            │  ▜▛    │
 └───────┘                            └───────┘

RELEASE (inertial flick, overshoot)  SAVED (settled, larger + heavier)
 ┌───────┐                            ┌───────┐
 │ ◤███◥  │   scale 1.18 → whip back   │  ███   │  amber, weight+size up
 │ █████  │   micro-bounce ×2          │  ███   │  scale 1.06 rest
 │ ◣███◢  │   faux-haptic settle       │  █▝▘█  │  bookmark notch cut
 └───────┘                            └───────┘

UN-SAVE (click saved → shake eject)
 ┌───────┐   ← ██ → ← ██ →  lateral shudder ×3, shrink back to outline
 └───────┘
```

## Seed-derived decisions

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Feedback modality (assigned axis) | 0 shape-change morph · 1 spatial displacement/slot-drop · 2 faux-haptic micro-bounce · 3 magnetic snap-recoil | `7g/i` | 2 | **faux-haptic micro-bounce** |
| 2 | Motion primitive | 0 spring bounce · 1 elastic overshoot · 2 weighted drop/settle · 3 rubber-band stretch · 4 inertial flick | `lufk` | 4 | **inertial flick** |
| 3 | State cue (unsaved↔saved) | 0 notch/indent depth · 1 tilt angle · 2 scale/size+weight · 3 position offset | `WuUm` | 2 | **scale/size+weight** |
| 4 | Spatial anchor (motion origin) | 0 from center · 1 from bottom edge (gravity) · 2 from click point · 3 from icon tip | `lVrX` | 0 | **from center** |
| 5 | Un-save affordance | 0 reverse of save anim · 1 shake-off/eject · 2 long-press to release · 3 tap toggle recoil | `qbXb` | 1 | **shake-off/eject** |
| 6 | Pending timing | 0 instant optimistic then confirm · 1 squash-hold · 2 tension build-up then release | `4TcI` | 2 | **tension build-up then release** |

Command run:
```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "7g/ilufkWuUmlVrXqbXb4TcIBW7RSFtK" 4 5 4 4 4 3
```
Output:
```
[2, 4, 2, 0, 1, 2]
```

## Why this diverges

**From the default solution:** The obvious Save button confirms with a color fill (outline bookmark turns solid blue). Here color is deliberately demoted — the icon reads its state from *size and weight*, and confirmation is delivered as a physical-feeling recoil. A colorblind or glance-only user still gets full state feedback.

**From the assigned-axis baseline:** The generic "diverge from visual-only" move is a single spring bounce. This concept pushes past that: the modality is a *faux-haptic micro-bounce* (multi-oscillation settle that simulates a detent, seed DP1=2) driven by an *inertial flick* primitive (DP2=4) originating *from center* (DP4=0), with a distinct *tension build-up on press* (DP6=2) that manufactures a real pending->saved arc, and an unusual *shake-off eject* for un-saving (DP5=1) rather than simply reversing the save animation. The combination is a spring-loaded stamp metaphor, not just "add a bounce."
