import type { On, ProcessRunResult } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'jacks-skills',
  component: 'Pane',
  requestId: 'review-board',
  props: {
    title: 'Review findings',
    isFocused: true,
    bodyColumns: 80,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const FINDING = {
  file: 'src/app.py',
  line: 12,
  summary: 'Off-by-one drops the last row',
  failure_scenario: 'A 3-row page returns 2 rows',
}

const ran = (exitCode: number, stdout = ''): { value: ProcessRunResult } => ({
  value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
})

// The host beneath the plugin: a session in /repo started as `claude --plugin-dir '/plug/a b'`.
function host(on: On, variables: Record<string, string>, hasClaudeWork: boolean) {
  mock.env(on, variables)
  const writes: Record<string, string> = {}
  const runs: string[][] = []
  on('tool.call', { tool: 'ReportFindings' }, () => ({ result: {} }))
  on('session.cwd', () => ({ value: '/repo' }))
  on('fs.write', (_, e) => ((writes[e.path] = e.text), { value: undefined }))
  on('process.run', (_, e) => {
    runs.push([...e.argv])
    if (e.argv[0] === 'sh') return ran(0, 'claude --plugin-dir=/plug/a --model opus\n')
    if (e.argv.includes('command -v claude-work')) return ran(hasClaudeWork ? 0 : 1)

    return ran(0)
  })

  return { writes, runs }
}

test('instructs the review skills to report, and leaves other skills alone', async ($, on) => {
  on('skill.prompt', (_, e) => ({ text: e.text }))

  const review = await $.skill.prompt({ skill: 'ponytail:ponytail-review', text: 'Review it.' })
  expect(review.text).toContain('mcp__jacks-skills__report_review_findings')
  expect(review.text).toContain('source: "ponytail-review"')

  const other = await $.skill.prompt({ skill: 'superpowers:brainstorming', text: 'Brainstorm.' })
  expect(other.text).toBe('Brainstorm.')
})

test('ReportFindings after test-audit lands under test-audit, without a second report instruction', async ($, on) => {
  host(on, {}, false)
  on('skill.prompt', (_, e) => ({ text: e.text }))

  const audit = await $.skill.prompt({ skill: 'jacks-skills:test-audit', text: 'Audit.' })
  expect(audit.text).toBe('Audit.')
  await $.tool.call({ tool: 'ReportFindings', findings: [{ ...FINDING, category: 'delete' }] })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /^\[delete\] Off-by-one/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^test-audit · src\/app\.py:12/ })).toBeDefined()
  await ui.unmount()
})

test('the status line points back to the board, which /review-board opens with the keyboard', async ($, on) => {
  host(on, {}, false)
  const statuses: (string | undefined)[] = []
  const opens: boolean[] = []
  on('ui.status', (_, e) => (statuses.push(e.text), { value: undefined }))
  on('ui.open', (_, e) => (opens.push(Boolean(e.focus)), { value: { isPlaced: true } }))
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })
  expect(statuses.at(-1)).toBe('1 review findings · /review-board')

  await $.command.run({
    command: 'review-board',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 200 },
  })
  expect(opens.at(-1)).toBe(true)

  const ui = await $.ui.mount({ ...PANE, props: { ...PANE.props, isFocused: false }, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /^ctrl\+x tab/ })).toBeDefined()
  const [ignore] = await ui.findAll({ type: 'Button', text: 'Ignore' })
  await ui.press({ key: String(ignore?.key) })
  expect(statuses.at(-1)).toBeUndefined()
  await ui.unmount()
})

test('in Ghostty, a button opens a tab running claude-work with the parent plugin dirs', async ($, on) => {
  const { writes, runs } = host(on, { TERM_PROGRAM: 'ghostty', SHELL: '/bin/zsh' }, true)
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING, { ...FINDING, summary: 'Second' }] })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect(await ui.find({ type: 'Text', text: /Off-by-one drops the last row/ })).toBeDefined()
    await ui.unmount()
  }

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const ignore = await ui.findAll({ type: 'Button', text: 'Ignore' })
  const feedback = await ui.findAll({ type: 'Button', text: 'receiving-feedback' })
  await ui.press({ key: String(feedback[0]?.key) })

  const [promptPath, prompt] = Object.entries(writes)[0] ?? []
  expect(
    prompt?.startsWith('/jacks-skills:receiving-feedback Review finding from `code-review` at `src/app.py:12`'),
  ).toBe(true)
  expect(prompt).toContain('A 3-row page returns 2 rows')
  const osascript = runs.find(argv => argv[0] === 'osascript')
  expect(osascript?.[3]).toBe('/repo')
  expect(osascript?.[4]).toBe(`claude-work --plugin-dir '/plug/a' "$(cat ${String(promptPath)})"\n`)
  expect(await ui.find({ type: 'Text', text: 'sent to jacks-skills:receiving-feedback' })).toBeDefined()

  await ui.press({ key: String(ignore[1]?.key) })
  expect(await ui.find({ type: 'Text', text: /Second/ })).toBeUndefined()
  await ui.unmount()
})

test('without claude-work, the tab runs claude', async ($, on) => {
  const { runs } = host(on, { TERM_PROGRAM: 'ghostty', SHELL: '/bin/bash' }, false)
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const [button] = await ui.findAll({ type: 'Button', text: 'receiving-code-review' })
  await ui.press({ key: String(button?.key) })

  expect(runs.find(argv => argv[0] === '/bin/bash')).toEqual(['/bin/bash', '-ic', 'command -v claude-work'])
  expect(runs.find(argv => argv[0] === 'osascript')?.[4]?.startsWith("claude --plugin-dir '/plug/a' ")).toBe(true)
  await ui.unmount()
})

test('outside Ghostty, a button starts a background agent instead', async ($, on) => {
  const { runs } = host(on, { TERM_PROGRAM: 'iTerm.app' }, true)
  const spawns: string[] = []
  on('agent.spawn', (_, e) => (spawns.push(e.prompt), { model: 'sonnet', agentId: 'agent-1' }))
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const [button] = await ui.findAll({ type: 'Button', text: 'receiving-code-review' })
  await ui.press({ key: String(button?.key) })

  expect(runs.some(argv => argv[0] === 'osascript')).toBe(false)
  expect(spawns[0]).toContain('`superpowers:receiving-code-review`')
  expect(spawns[0]).toContain('Off-by-one drops the last row')
  expect(await ui.find({ type: 'Text', text: /background agent/ })).toBeDefined()
  await ui.unmount()
})
