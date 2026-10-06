import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Timer } from 'claude-code'

import { COP_COLUMNS, COP_ROWS, copCells, copSvg } from './clawd'

// Replaces the terse-comments.py / verbose-docstrings.py PostToolUse advisors:
// judges the added text on tool.call and denies, so the model rewrites before
// anything lands. Only files with a known code marker are judged.

const MAX_BLOCK_LINES = 3
const MAX_COMMENT_CHARS = 120 // a single standalone comment line past this is over budget
const MAX_DOCSTRING_WORDS = 160

// file extension -> line-comment marker
const MARKERS: Record<string, string> = {
  '.py': '#',
  '.pyi': '#',
  '.sh': '#',
  '.bash': '#',
  '.zsh': '#',
  '.yaml': '#',
  '.yml': '#',
  '.toml': '#',
  '.rb': '#',
  '.ts': '//',
  '.tsx': '//',
  '.js': '//',
  '.jsx': '//',
  '.mjs': '//',
  '.go': '//',
  '.rs': '//',
  '.c': '//',
  '.h': '//',
  '.cpp': '//',
  '.java': '//',
  '.scss': '//',
}

// Comment bodies that are machine directives, not prose; matched case-insensitively
// against the text after the marker, anchored at its start.
const DIRECTIVE_PREFIXES = [
  '!',
  'noqa',
  'type:',
  'mypy:',
  'ruff:',
  'pyright:',
  'pytype:',
  'flake8:',
  'pylint:',
  'isort:',
  'fmt:',
  'yapf:',
  'black:',
  'pragma:',
  'nosec',
  'coding:',
  '-*-',
  'eslint',
  '@ts-',
  '@flow',
  '@jsx',
  'prettier-ignore',
  'biome-ignore',
  'istanbul ignore',
  'c8 ignore',
  'deno-lint-ignore',
  'nosonar',
  'sourcemappingurl',
  'global ',
  'ponytail:',
]

// Stale references and dead-context narration that should never land in code.
const PATTERNS: { re: RegExp; why: string }[] = [
  { re: /\bML-\d+\b/, why: 'a ticket reference (ML-NNNN) — name the behavior, not the ticket' },
  { re: /§\s*\d/, why: 'a spec section reference (§N.N) — these rot when the spec is renumbered' },
  { re: /docs\/plans\//, why: 'a docs/plans/ reference — plan docs are deleted; the code must stand alone' },
  {
    re: /\bwe(?:'| a)?re no longer\b/i,
    why: '"we\'re no longer doing X" narration — describe what the code does, not what it stopped doing',
  },
]

const COMMENT_GUIDANCE =
  'For each flagged comment:\n' +
  '1. Can it be deleted entirely and lose no information?\n' +
  '2. Does it restate what the code already says?\n' +
  '3. Can it be one short declarative line?\n' +
  '4. Does it repeat what the called function/class docstring already tells you?'

const DOCSTRING_GUIDANCE =
  'For each flagged docstring:\n' +
  '1. Can any sentence be deleted with no loss?\n' +
  '2. Does it restate what the signature already shows?\n' +
  '3. Can the prose become a tight summary plus terse Args/Returns?'

const markerFor = (path: string): string | undefined => {
  for (const [ext, marker] of Object.entries(MARKERS)) if (path.endsWith(ext)) return marker
  return undefined
}

const isDirective = (body: string): boolean => {
  const low = body.toLowerCase()
  return DIRECTIVE_PREFIXES.some(p => low.startsWith(p))
}

// Prose worth judging: has a letter or digit and is not a tooling directive.
const keep = (body: string): boolean => /[a-z0-9]/i.test(body) && !isDirective(body)

// Standalone comment lines (marker is the first non-whitespace content), mapped
// line-number -> body; trailing inline comments are left alone.
// ponytail: line-start scan, no string tracking — a marker opening a continuation
// line inside a multi-line string is misread. Rare; port the py/slash scanners if it bites.
const standaloneComments = (lines: string[], marker: string): Map<number, string> => {
  const found = new Map<number, string>()
  lines.forEach((line, i) => {
    const t = line.trimStart()
    if (t.startsWith(marker)) found.set(i + 1, t.slice(marker.length).trim())
  })
  return found
}

// Group comment line numbers into blocks; blank lines between them do not split a block.
const groupBlocks = (nums: number[], lines: string[]): number[][] => {
  const blocks: number[][] = []
  let cur: number[] = []
  for (const ln of [...nums].sort((a, b) => a - b)) {
    const prev = cur[cur.length - 1]
    if (prev !== undefined) {
      let gapBlank = true
      for (let k = prev + 1; k < ln; k++) if ((lines[k - 1] ?? '').trim() !== '') gapBlank = false
      if (!(ln === prev + 1 || gapBlank)) {
        blocks.push(cur)
        cur = []
      }
    }
    cur.push(ln)
  }
  if (cur.length) blocks.push(cur)
  return blocks
}

const commentReasons = (text: string, marker: string): string[] => {
  const lines = text.split('\n')
  const comments = standaloneComments(lines, marker)
  const kept = [...comments].filter(([, body]) => keep(body)).map(([n]) => n)
  const reasons: string[] = []

  for (const block of groupBlocks(kept, lines)) {
    if (block.length > MAX_BLOCK_LINES) {
      const body = block.map(n => (lines[n - 1] ?? '').trim()).join('\n')
      reasons.push(
        `${block.length}-line comment block (max ${MAX_BLOCK_LINES}); compress or move detail into a docstring:\n${body}`,
      )
    }
  }
  for (const n of kept) {
    const stripped = (lines[n - 1] ?? '').trim()
    if (stripped.length > MAX_COMMENT_CHARS) {
      reasons.push(`comment line is ${stripped.length} chars (max ${MAX_COMMENT_CHARS}): ${stripped}`)
    }
  }
  return reasons
}

// Python docstrings: a triple-quoted string opening the line (optional r/b/u/f prefix).
// ponytail: catches docstring-position strings, skips `x = """..."""`; a bare
// multi-line string expression statement is a rare false positive. No ast here.
const DOCSTRING_RE = /^[ \t]*(?:[rbuf]{0,2})?("""|''')([\s\S]*?)\1/gim

const docstringReasons = (text: string): string[] => {
  const reasons: string[] = []
  for (const m of text.matchAll(DOCSTRING_RE)) {
    const body = (m[2] ?? '').trim()
    const words = body.split(/\s+/).filter(Boolean).length
    if (words > MAX_DOCSTRING_WORDS) {
      const preview = body.split(/\s+/).slice(0, 20).join(' ')
      reasons.push(`docstring is ${words} words (max ${MAX_DOCSTRING_WORDS}); condense it:\n${preview} ...`)
    }
  }
  return reasons
}

const patternReasons = (text: string): string[] =>
  PATTERNS.filter(p => p.re.test(text)).map(p => `added text contains ${p.why}`)

const check = (path: string, text: string): string[] => {
  const marker = markerFor(path)
  if (marker === undefined) return [] // not a code file we judge
  const comments = commentReasons(text, marker)
  const docstrings = marker === '#' && path.endsWith('.py') ? docstringReasons(text) : []
  return [...comments, ...docstrings, ...patternReasons(text)]
}

// Writes under the harness temp dir are scratch (test fixtures, staged edits),
// never source we judge. TMPDIR is absolute; a relative file_path never matches.
const inTempDir = async ($: EngineInterface, path: string): Promise<boolean> => {
  const tmp = await $.env.get('TMPDIR')
  if (tmp === undefined || tmp === '') return false
  const base = tmp.endsWith('/') ? tmp : tmp + '/'
  return path.startsWith(base)
}

const buildDenial = (path: string, reasons: string[]): string => {
  const hasComment = reasons.some(r => r.startsWith('comment') || r.includes('comment block'))
  const hasDocstring = reasons.some(r => r.startsWith('docstring'))
  const guidance = [hasComment ? COMMENT_GUIDANCE : '', hasDocstring ? DOCSTRING_GUIDANCE : '']
    .filter(Boolean)
    .join('\n\n')
  return (
    `comment-cop blocked this write to ${path}. Fix these before writing:\n\n` +
    reasons.map((r, i) => `${i + 1}. ${r}`).join('\n\n') +
    (guidance ? `\n\n${guidance}` : '') +
    '\n\nRewrite the text and submit the edit again.'
  )
}

// The siren shows for this long after a block, animating; a fresh block restarts the clock.
const SIREN_MS = 8000
const firedAt = atom({ plugin: 'jacks-skills', key: 'copFiredAt' } as const, 0)
const frame = atom({ plugin: 'jacks-skills', key: 'copFrame' } as const, 0)

let siren: Timer | undefined

// One animation tick: advance the frame, and stop once the siren window has passed.
async function tickSiren($: EngineInterface) {
  await update($, frame, n => (n + 1) % 60)
  if (Date.now() - (await read($, firedAt)) > SIREN_MS) {
    siren?.cancel()
    siren = undefined
    await update($, firedAt, () => 0)
  }
}

// Flash the band and keep it animating; a fresh block restarts the clock.
async function raiseSiren($: EngineInterface) {
  await update($, firedAt, () => Date.now())
  siren ??= $.clock.every(100, () => void tickSiren($))
}

// Judges the added text of Edit/Write before it lands and denies on a violation,
// drawing a dim one-line breadcrumb in the transcript and raising an animated Clawd
// cop in the band above the prompt. register.tsx calls this.
export const registerCommentCop = (on: On) => {
  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    if (await inTempDir($, e.file_path)) return next(e)
    const reasons = check(e.file_path, e.new_string)
    if (reasons.length === 0) return next(e)
    $.ui.log(`comment-cop: refused Edit to ${e.file_path} — ${reasons.length} issue(s)`)
    await raiseSiren($)
    return { deny: buildDenial(e.file_path, reasons) }
  })

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    if (await inTempDir($, e.file_path)) return next(e)
    const reasons = check(e.file_path, e.content)
    if (reasons.length === 0) return next(e)
    $.ui.log(`comment-cop: refused Write to ${e.file_path} — ${reasons.length} issue(s)`)
    await raiseSiren($)
    return { deny: buildDenial(e.file_path, reasons) }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || (await read($, firedAt)) === 0) return next(e)
    const tick = await read($, frame)
    // Fullscreen terminal and desktop only; the default inline TUI passes.
    let clawd = null
    if (e.surface === 'desktop') {
      const { Svg } = $.ui.resolve(e)
      clawd = <Svg source={copSvg(tick)} alt="Clawd as a four-legged cop in a peaked cap and sunglasses" />
    } else if (e.surface === 'terminal' && e.viewport?.isFullscreen === true && e.props.bodyColumns >= COP_COLUMNS) {
      const { Raster } = $.ui.resolve(e)
      clawd = <Raster key="cop" columns={COP_COLUMNS} rows={COP_ROWS} cells={copCells(tick)} />
    }
    if (clawd === null) return next(e)
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" alignItems="center" width="100%">
        {clawd}
        <Box flexGrow={1} justifyContent="flex-end" flexDirection="row">
          <Text bold color="red">
            🚨 Stop right there criminal scum! No one writes a giant comment on my watch!
          </Text>
        </Box>
      </Box>
    )
  })
}
