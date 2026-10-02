// Clawd as a pixel sprite: drawn as half-block cells for the terminal's Raster, or as rects for desktop's Svg.
export const CLAWD_COLUMNS = 36
export const CLAWD_ROWS = 6
// The cop: a wide four-legged Clawd in a peaked cap and sunglasses.
export const COP_COLUMNS = 36
export const COP_ROWS = 8

const NONE = -1
const DEFAULT = 0x01000000
const BODY = 0xd77757
const EYE = 0x141413
const LID = 0x8b8f97
const EDGE = 0xc5c8ce
const LOGO = 0xf0eee6

export type Mood = 'typing' | 'happy'

const draw = (w: number, h: number) => {
  const px: number[] = new Array<number>(w * h).fill(NONE)
  const rect = (x: number, y: number, rw: number, rh: number, color: number) => {
    for (let j = y; j < y + rh; j++)
      for (let i = x; i < x + rw; i++) if (i >= 0 && i < w && j >= 0 && j < h) px[j * w + i] = color
  }
  const clear = (...xy: [number, number][]) => {
    for (const [x, y] of xy) px[y * w + x] = NONE
  }
  return { px, rect, clear }
}

const pixels = (mood: Mood, tick: number) => {
  const w = CLAWD_COLUMNS
  const { px, rect } = draw(w, CLAWD_ROWS * 2)
  rect(6, 2, 24, 8, BODY)
  for (const x of [8, 12, 22, 26]) rect(x, 10, 2, 2, BODY)
  if (mood === 'happy') {
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

const copPixels = (tick: number) => {
  const w = COP_COLUMNS
  const { px, rect, clear } = draw(w, COP_ROWS * 2)
  const HAT = 0x1a2a4a
  const BRIM = 0x0f1a30
  const SHADE = 0x141413
  const GLINT = 0xf0eee6
  // Wide body blob, rounded corners.
  rect(5, 4, 26, 8, BODY)
  clear([5, 4], [30, 4], [5, 11], [30, 11])
  // Four legs with a two-frame shuffle: diagonal pairs step in turn.
  const flip = Math.floor(tick / 5) % 2 === 0
  const a = flip ? 1 : 0
  const b = flip ? 0 : 1
  rect(8, 11, 3, 3 + a, BODY)
  rect(14, 11, 3, 3 + b, BODY)
  rect(21, 11, 3, 3 + a, BODY)
  rect(27, 11, 3, 3 + b, BODY)
  // Peaked cap, centered: domed crown, band, and overhanging brim.
  rect(13, 0, 10, 3, HAT)
  clear([13, 0], [22, 0])
  rect(13, 3, 10, 1, BRIM)
  rect(11, 4, 14, 1, BRIM)
  // Sunglasses under the cap: two lenses and a bridge, a glint on each.
  rect(12, 6, 5, 3, SHADE)
  rect(19, 6, 5, 3, SHADE)
  rect(17, 7, 2, 1, SHADE)
  rect(12, 6, 1, 1, GLINT)
  rect(19, 6, 1, 1, GLINT)
  return px
}

// RasterProps.cells: per cell, [codePoint, foreground, background] as little-endian u32s, base64.
const packCells = (px: number[], columns: number, rows: number) => {
  const words = new Uint32Array(columns * rows * 3)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const top = px[2 * r * columns + c] ?? NONE
      const bottom = px[(2 * r + 1) * columns + c] ?? NONE
      const cell =
        top === NONE && bottom === NONE
          ? [0x20, DEFAULT, DEFAULT]
          : top === NONE
            ? [0x2584, bottom, DEFAULT]
            : [0x2580, top, bottom === NONE ? DEFAULT : bottom]
      words.set(cell, (r * columns + c) * 3)
    }
  }
  return btoa(String.fromCharCode(...new Uint8Array(words.buffer)))
}

const toSvg = (px: number[], columns: number, rows: number, scale: number) => {
  const h = rows * 2
  const rects: string[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < columns;) {
      const color = px[y * columns + x] ?? NONE
      let end = x + 1
      while (end < columns && px[y * columns + end] === color) end++
      if (color !== NONE) {
        const fill = `#${color.toString(16).padStart(6, '0')}`
        rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${fill}"/>`)
      }
      x = end
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${columns} ${h}" width="${columns * scale}" height="${h * scale}" shape-rendering="crispEdges">${rects.join('')}</svg>`
}

export const clawdCells = (mood: Mood, tick: number) => packCells(pixels(mood, tick), CLAWD_COLUMNS, CLAWD_ROWS)
export const clawdSvg = (mood: Mood, tick: number, scale = 5) =>
  toSvg(pixels(mood, tick), CLAWD_COLUMNS, CLAWD_ROWS, scale)
export const copCells = (tick: number) => packCells(copPixels(tick), COP_COLUMNS, COP_ROWS)
export const copSvg = (tick: number, scale = 5) => toSvg(copPixels(tick), COP_COLUMNS, COP_ROWS, scale)
