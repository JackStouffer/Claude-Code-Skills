import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

// Stand in for the engine beneath the plugin so a passed-through write does not
// touch a real fs; records whether it was reached.
const stubWrites = (on: On, reached: { did: boolean }) => {
  on('tool.call', { tool: 'Write' }, () => {
    reached.did = true
    return { result: 'wrote' }
  })
  on('tool.call', { tool: 'Edit' }, () => {
    reached.did = true
    return { result: 'edited' }
  })
}

const logLines = (on: On, lines: string[]) => {
  on('ui.log', (_$, e, next) => {
    lines.push(e.text)
    return next(e)
  })
}

const VERBOSE_BLOCK = [
  '# first line of the block',
  '# second line of the block',
  '# third line of the block',
  '# fourth line of the block',
  'x = 1',
].join('\n')

test('denies a Write whose added text has an over-budget comment block', async ($, on) => {
  const reached = { did: false }
  const lines: string[] = []
  stubWrites(on, reached)
  logLines(on, lines)

  const res = await $.tool.call({ tool: 'Write', file_path: '/repo/a.py', content: VERBOSE_BLOCK })

  expect(res.deny).toContain('4-line comment block')
  expect(reached.did).toBe(false)
  expect(lines.at(-1)).toContain('refused Write to /repo/a.py')
})

test('passes a Write with a terse comment through to the engine', async ($, on) => {
  const reached = { did: false }
  stubWrites(on, reached)

  const res = await $.tool.call({ tool: 'Write', file_path: '/repo/a.py', content: '# counts rows\nx = 1\n' })

  expect(res.deny).toBeUndefined()
  expect(reached.did).toBe(true)
})

test('denies an Edit whose added text carries a stale reference', async ($, on) => {
  const reached = { did: false }
  stubWrites(on, reached)

  const res = await $.tool.call({
    tool: 'Edit',
    file_path: '/repo/a.ts',
    old_string: 'const x = 1',
    new_string: '// see docs/plans/old.md and §4.5\nconst x = 1',
  })

  expect(res.deny).toContain('docs/plans/')
  expect(res.deny).toContain('spec section reference') // the §4.5 is flagged too
  expect(reached.did).toBe(false)
})

test('denies a Python docstring over the word budget', async ($, on) => {
  const reached = { did: false }
  stubWrites(on, reached)
  const long = Array.from({ length: 170 }, (_, i) => `w${i}`).join(' ')

  const res = await $.tool.call({
    tool: 'Write',
    file_path: '/repo/a.py',
    content: `def f():\n    """${long}"""\n    return 1\n`,
  })

  expect(res.deny).toContain('docstring is 170 words')
  expect(reached.did).toBe(false)
})

test('leaves non-code files alone even with a ticket reference', async ($, on) => {
  const reached = { did: false }
  stubWrites(on, reached)

  const res = await $.tool.call({
    tool: 'Write',
    file_path: '/repo/notes.md',
    content: 'Tracking ML-1234 here, see docs/plans/x.md.',
  })

  expect(res.deny).toBeUndefined()
  expect(reached.did).toBe(true)
})
