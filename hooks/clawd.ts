// Clawd as a 36x12 pixel sprite: drawn as half-block cells for the terminal's Raster, or as rects for desktop's Svg.
export const CLAWD_COLUMNS = 36
export const CLAWD_ROWS = 6

const W = CLAWD_COLUMNS
const H = CLAWD_ROWS * 2
const NONE = -1
const DEFAULT = 0x01000000
const BODY = 0xd77757
const EYE = 0x141413
const LID = 0x8b8f97
const EDGE = 0xc5c8ce
const LOGO = 0xf0eee6

export type Mood = 'typing' | 'happy'

const pixels = (mood: Mood, tick: number) => {
  const px: number[] = new Array<number>(W * H).fill(NONE)
  const rect = (x: number, y: number, w: number, h: number, color: number) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px[j * W + i] = color
  }
  rect(6, 2, 24, 8, BODY)
  for (const x of [8, 12, 22, 26]) rect(x, 10, 2, 2, BODY)
  if (mood === 'happy') {
    // Arms up, ^ ^ eyes.
    rect(4, 4, 2, 2, BODY)
    rect(2, 2, 2, 2, BODY)
    rect(30, 4, 2, 2, BODY)
    rect(32, 2, 2, 2, BODY)
    for (const x of [9, 23]) {
      rect(x + 1, 4, 2, 1, EYE)
      rect(x, 5, 1, 1, EYE)
      rect(x + 3, 5, 1, 1, EYE)
    }
    return px
  }
  // Typing: bursts of alternating taps with a pause, a blink every 6s, eyes down on the laptop's lid.
  const isTapping = tick % 20 < 14
  const left = isTapping && Math.floor(tick / 2) % 2 === 0 ? 1 : 0
  const right = isTapping && !left ? 1 : 0
  rect(2, 6 + left, 4, 2, BODY)
  rect(30, 6 + right, 4, 2, BODY)
  if (tick % 60 < 58) {
    rect(10, 5, 2, 2, EYE)
    rect(24, 5, 2, 2, EYE)
  }
  rect(8, 8, 20, 4, LID)
  rect(8, 7, 20, 1, EDGE)
  rect(17, 9, 2, 2, LOGO)
  return px
}

// RasterProps.cells: per cell, [codePoint, foreground, background] as little-endian u32s, base64.
export const clawdCells = (mood: Mood, tick: number) => {
  const px = pixels(mood, tick)
  const words = new Uint32Array(W * CLAWD_ROWS * 3)
  for (let r = 0; r < CLAWD_ROWS; r++) {
    for (let c = 0; c < W; c++) {
      const top = px[2 * r * W + c] ?? NONE
      const bottom = px[(2 * r + 1) * W + c] ?? NONE
      const cell =
        top === NONE && bottom === NONE
          ? [0x20, DEFAULT, DEFAULT]
          : top === NONE
            ? [0x2584, bottom, DEFAULT]
            : [0x2580, top, bottom === NONE ? DEFAULT : bottom]
      words.set(cell, (r * W + c) * 3)
    }
  }
  return btoa(String.fromCharCode(...new Uint8Array(words.buffer)))
}

export const clawdSvg = (mood: Mood, tick: number, scale = 5) => {
  const px = pixels(mood, tick)
  const rects: string[] = []
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W;) {
      const color = px[y * W + x] ?? NONE
      let end = x + 1
      while (end < W && px[y * W + end] === color) end++
      if (color !== NONE) {
        const fill = `#${color.toString(16).padStart(6, '0')}`
        rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${fill}"/>`)
      }
      x = end
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * scale}" height="${H * scale}" shape-rendering="crispEdges">${rects.join('')}</svg>`
}
