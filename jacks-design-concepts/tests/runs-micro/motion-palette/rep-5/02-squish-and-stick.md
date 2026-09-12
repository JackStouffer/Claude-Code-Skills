# Squish-and-Stick

## Core idea
A bookmark button that behaves like a lump of soft gel: the click physically
squashes it flat and it springs back overfilled and stuck (filled glyph). The
save is communicated by deformation and elastic recoil, not by a color wash.

## Key visual + interaction principles
- The button is a compressible body. Press = squash (wide + short), release =
  stretch-recoil past rest, then settle. Weight, not paint, reads as "saved".
- The glyph itself changes identity at the moment of maximum squash: a
  hollow outline bookmark becomes a solid bookmark with a cut notch, so the
  new state is legible even at the frozen midpoint of the animation.
- All deformation originates from the geometric center of the button, so the
  squash reads as an object being pressed straight down, not sliding.
- Un-saving is a deliberate reverse: click again plays the recoil backwards
  (stretch tall, thin, then pop hollow) and opens a ~2s undo micro-window so a
  mis-tap is one click to reverse.
- Palette is deep ink on near-black with a single chartreuse/lime accent that
  only appears on the filled (saved) glyph — restraint keeps the motion, not
  the color, as the message.

## Palette
- Surface: `#0E1116` (near-black ink)
- Button rest body: `#1C2029`
- Outline glyph (unsaved): `#8A93A6` (muted slate)
- Filled glyph (saved): `#C6F135` (chartreuse/lime), notch shows surface color
- Undo micro-window text: `#8A93A6`

## ASCII wireframe

```
REST (unsaved)              PRESS (squash, t=0)        RECOIL (overshoot)         SETTLED (saved)
 .--------.                  .------------.              .--.                       .--------.
 |        |                 (   ________   )            |    |                     |        |
 |  |‾‾|  |   click ───►     (  |__  __|  )   ───►       | ▓▓ |      ───►           |  |▓▓|  |
 |  |  |  |                  (   \____/    )             | ▓▓ |                     |  |▓▓|  |
 |  |__|  |                   `----------`              | ▓▓ |                     |  |vv|  |
 |________|                  wide + short               |____|                     |________|
 hollow outline              glyph flips to filled      tall + thin overshoot      solid + lime notch
                             at max squash              springs back

UN-SAVE:  click saved  ───►  stretch tall/thin  ───►  pop hollow  ───►  [ Saved · Undo ]  (~2s)
```

## Seed-derived decisions

| # | decision point | options (0-based) | seed segment | sum(ASCII) mod n | chosen |
|---|----------------|-------------------|--------------|------------------|--------|
| 1 | Feedback modality (assigned axis) | 0 faux-haptic micro-bounce · 1 shape morph outline→ribbon · 2 spatial lift+drop-shadow · 3 audio tick + tactile pulse · 4 elastic squash-and-stretch | `R9qu` | 4 | **elastic squash-and-stretch** |
| 2 | Motion primitive | 0 opacity crossfade · 1 rotate/spin · 2 slide/translate · 3 scale/pinch · 4 path stroke-draw | `y+uR` | 3 | **scale/pinch** |
| 3 | State cue pending→saved | 0 color swap · 1 glyph change (outline→filled+notch) · 2 badge/dot · 3 label text swap | `37lC` | 1 | **glyph change** |
| 4 | Spatial anchor / origin of motion | 0 button center · 1 bottom edge · 2 top notch · 3 cursor/click point | `DSd1` | 0 | **button center** |
| 5 | Un-save interaction | 0 click toggles instantly · 1 reverse squash + undo micro-window · 2 long-press to remove · 3 hover reveals × | `xeiW` | 1 | **reverse squash + undo window** |
| 6 | Palette identity | 0 slate + electric blue · 1 cream + terracotta · 2 deep ink + chartreuse/lime · 3 grayscale + amber · 4 forest + gold · 5 purple dusk + coral | `EHRU` | 2 | **deep ink + chartreuse/lime** |

Command run:

```
python3 -c 'import sys;s=sys.argv[1];print([sum(map(ord,s[4*i:4*i+4]))%int(n) for i,n in enumerate(sys.argv[2:])])' "R9quy+uR37lCDSd1xeiWEHRUtJpce/OE" 5 5 4 4 4 6
```

Output:

```
[4, 3, 1, 0, 1, 2]
```

## Why this diverges

**From the default solution:** The obvious Save button fills a color from empty
to full and stops. Here the color accent is almost incidental (one lime notch);
the entire "saved" signal is carried by physical deformation — the body squashes
under the press and springs back overfilled, so the button reads as a soft
object that got stuck, not a checkbox that got painted.

**From the assigned-axis baseline:** The axis says diverge from visual-only fill.
The lazy way to satisfy that axis is a small confirm bounce (option 0) bolted
onto an otherwise normal fill. This concept commits fully to squash-and-stretch
as the primary language: press-squash and recoil-overshoot are the interaction,
the glyph identity flip happens at max squash so state is legible mid-motion,
and even the un-save is the same deformation run in reverse. The feedback
modality is the concept, not a garnish on a fill.
