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
function host(on: On, variables: Record<string, string>, hasClaudeWork: boolean, canBackground = true) {
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
    if (e.argv[2]?.includes(' --bg')) return ran(canBackground ? 0 : 1)

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

  const focused = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await focused.find({ type: 'Text', text: /^Tab moves between buttons/ })).toBeDefined()
  const [first] = await focused.findAll({ type: 'Button', text: 'receiving-feedback' })
  expect(first?.props['autoFocus']).toBe(true)
  await focused.unmount()

  const ui = await $.ui.mount({ ...PANE, props: { ...PANE.props, isFocused: false }, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /^Run \/review-board to use the buttons/ })).toBeDefined()
  const [ignore] = await ui.findAll({ type: 'Button', text: 'Ignore' })
  await ui.press({ key: String(ignore?.key) })
  expect(statuses.at(-1)).toBeUndefined()
  await ui.unmount()
})

test('a button starts a background session running claude-work with the parent plugin dirs', async ($, on) => {
  const { runs } = host(on, { SHELL: '/bin/zsh' }, true)
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

  const [shell, flag, launch] = runs.at(-1) ?? []
  expect([shell, flag]).toEqual(['/bin/zsh', '-ic'])
  expect(
    launch?.startsWith(
      "claude-work --bg --name 'receiving-feedback: Off-by-one drops the last row' --plugin-dir '/plug/a' " +
        "'/jacks-skills:receiving-feedback Review finding from `code-review` at `src/app.py:12`",
    ),
  ).toBe(true)
  expect(launch).toContain('A 3-row page returns 2 rows')
  expect(await ui.find({ type: 'Text', text: 'sent to jacks-skills:receiving-feedback (agents view)' })).toBeDefined()

  await ui.press({ key: String(ignore[1]?.key) })
  expect(await ui.find({ type: 'Text', text: /Second/ })).toBeUndefined()
  await ui.unmount()
})

test('in Ghostty, the board also offers a tab per skill, which runs claude-work there', async ($, on) => {
  const { writes, runs } = host(on, { TERM_PROGRAM: 'ghostty', SHELL: '/bin/zsh' }, true)
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })

  const desktop = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await desktop.find({ type: 'Button', text: /Ghostty tab/ })).toBeUndefined()
  await desktop.unmount()

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const labels = (await ui.findAll({ type: 'Button' })).map(button => button.text)
  expect(labels).toEqual([
    'Ignore',
    'Run receiving-code-review in Ghostty tab',
    'Run receiving-feedback in Ghostty tab',
    'Run receiving-code-review in bg agent',
    'Run receiving-feedback in bg agent',
  ])
  const [tab] = await ui.findAll({ type: 'Button', text: 'Run receiving-feedback in Ghostty tab' })
  await ui.press({ key: String(tab?.key) })

  const [promptPath, prompt] = Object.entries(writes)[0] ?? []
  expect(prompt?.startsWith('/jacks-skills:receiving-feedback Review finding from `code-review`')).toBe(true)
  const osascript = runs.find(argv => argv[0] === 'osascript')
  expect(osascript?.[3]).toBe('/repo')
  expect(osascript?.[4]).toBe(`claude-work --plugin-dir '/plug/a' "$(cat ${String(promptPath)})"\n`)
  expect(await ui.find({ type: 'Text', text: 'sent to jacks-skills:receiving-feedback (Ghostty tab)' })).toBeDefined()
  await ui.unmount()
})

test('without claude-work, the background session runs claude', async ($, on) => {
  const { runs } = host(on, { SHELL: '/bin/bash' }, false)
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const [button] = await ui.findAll({ type: 'Button', text: 'receiving-code-review' })
  await ui.press({ key: String(button?.key) })

  expect(runs.find(argv => argv[0] === '/bin/bash')).toEqual(['/bin/bash', '-ic', 'command -v claude-work'])
  expect(runs.at(-1)?.[2]?.startsWith("claude --bg --name 'receiving-code-review: Off-by-one")).toBe(true)
  await ui.unmount()
})

test('when the background session fails to start, a button starts a background agent instead', async ($, on) => {
  host(on, {}, true, false)
  const spawns: string[] = []
  on('agent.spawn', (_, e) => (spawns.push(e.prompt), { model: 'sonnet', agentId: 'agent-1' }))
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const [button] = await ui.findAll({ type: 'Button', text: 'receiving-code-review' })
  await ui.press({ key: String(button?.key) })

  expect(spawns[0]).toContain('`superpowers:receiving-code-review`')
  expect(spawns[0]).toContain('Off-by-one drops the last row')
  expect(await ui.find({ type: 'Text', text: /background agent/ })).toBeDefined()
  await ui.unmount()
})

test('on desktop, a button drafts a background agent request in the prompt box', async ($, on) => {
  const { runs } = host(on, {}, true)
  const fills: string[] = []
  on('prompt.fill', (_, e) => (fills.push(e.text), { isFilled: true, text: e.text, cursor: e.text.length }))
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  const [button] = await ui.findAll({ type: 'Button', text: 'receiving-feedback' })
  await ui.press({ key: String(button?.key) })

  expect(runs.some(argv => argv[2]?.includes(' --bg'))).toBe(false)
  expect(fills[0]).toContain('background agent')
  expect(fills[0]).toContain('`jacks-skills:receiving-feedback`')
  expect(fills[0]).toContain('Off-by-one drops the last row')
  expect(await ui.find({ type: 'Text', text: /prompt box, press Enter/ })).toBeDefined()
  await ui.unmount()
})

test('a send that throws says why in a toast', async ($, on) => {
  host(on, {}, true, false)
  const toasts: string[] = []
  on('ui.toast', (_, e) => (toasts.push(e.text), { value: undefined }))
  // Nothing answers agent.spawn, so the fallback rejects.
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const [button] = await ui.findAll({ type: 'Button', text: 'receiving-code-review' })
  await ui.press({ key: String(button?.key) })

  expect(toasts.at(-1)?.startsWith('Send failed: ')).toBe(true)
  await ui.unmount()
})
