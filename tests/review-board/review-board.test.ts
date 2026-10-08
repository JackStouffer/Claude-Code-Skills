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

const WORKTREE = /^\/repo\/\.claude\/worktrees\/review-[\w-]+$/

// The host beneath the plugin: a session in /repo, on branch main, started as `claude --plugin-dir '/plug/a b'`.
function host(
  on: On,
  variables: Record<string, string>,
  hasClaudeWork: boolean,
  canBackground = true,
  status = '',
  canOpenTab = true,
) {
  mock.env(on, variables)
  const writes: Record<string, string> = {}
  const runs: string[][] = []
  const cwds: (string | undefined)[] = []
  on('tool.call', { tool: 'ReportFindings' }, () => ({ result: {} }))
  on('session.cwd', () => ({ value: '/repo' }))
  on('fs.write', (_, e) => ((writes[e.path] = e.text), { value: undefined }))
  on('process.run', (_, e) => {
    runs.push([...e.argv])
    cwds.push(e.init?.cwd)
    if (e.argv[0] === 'sh') return ran(0, 'claude --plugin-dir=/plug/a --model opus\n')
    if (e.argv[1] === 'rev-parse') return ran(0, '/repo\nmain\n')
    if (e.argv[1] === 'status') return ran(0, status)
    if (e.argv[0] === 'osascript') return ran(canOpenTab ? 0 : 1)
    if (e.argv.includes('command -v claude-work')) return ran(hasClaudeWork ? 0 : 1)
    if (e.argv.at(-1)?.includes(' --bg')) return ran(canBackground ? 0 : 1)

    return ran(0)
  })

  return { writes, runs, cwds }
}

const gitRuns = (runs: string[][], command: string) => runs.filter(argv => argv[0] === 'git' && argv[1] === command)

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

test('/review-board opens the board with the keyboard', async ($, on) => {
  host(on, {}, false)
  const opens: boolean[] = []
  on('ui.open', (_, e) => (opens.push(Boolean(e.focus)), { value: { isPlaced: true } }))
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })

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
  await ui.unmount()
})

test('recording findings forces a repaint, so a pane carried over from a prior session is not left stale', async ($, on) => {
  host(on, {}, false)
  const invalidated: string[] = []
  on('ui.invalidate', (_, e) => (invalidated.push(e.event), { value: undefined }))

  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })

  expect(invalidated).toContain('ui.render')
})

test('a button starts a background session running claude-work with the parent plugin dirs', async ($, on) => {
  const { runs, cwds } = host(on, { SHELL: '/bin/zsh' }, true)
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

  // Job control off (+m): an interactive shell would otherwise take the terminal from the TUI.
  const [shell, monitor, flag, launch] = runs.at(-1) ?? []
  expect([shell, monitor, flag]).toEqual(['/bin/zsh', '+m', '-ic'])
  expect(
    launch?.startsWith(
      "claude-work --bg --name 'receiving-feedback: Off-by-one drops the last row' --plugin-dir '/plug/a' " +
        "--append-system-prompt 'This session works in its own git worktree, on branch `review/",
    ),
  ).toBe(true)
  expect(launch).toContain(
    "run the `jacks-skills:merge-back` skill.' '/jacks-skills:receiving-feedback Review finding from `code-review` at `src/app.py:12`",
  )
  expect(launch).toContain('A 3-row page returns 2 rows')

  // The session runs in a worktree on a new branch that tracks the current one.
  const [add] = gitRuns(runs, 'worktree')
  expect(add?.slice(0, 5)).toEqual(['git', 'worktree', 'add', '--track', '-b'])
  expect(add?.[5]).toMatch(/^review\/[\w-]+$/)
  expect(add?.[6]).toMatch(WORKTREE)
  expect(add?.[7]).toBe('main')
  expect(cwds.at(-1)).toBe(add?.[6])
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
  expect(osascript?.[3]).toMatch(WORKTREE)
  expect(osascript?.[4]?.startsWith("claude-work --plugin-dir '/plug/a' --append-system-prompt 'This session")).toBe(
    true,
  )
  expect(osascript?.[4]?.endsWith(`merge-back\` skill.' "$(cat ${String(promptPath)})"\n`)).toBe(true)
  expect(await ui.find({ type: 'Text', text: 'sent to jacks-skills:receiving-feedback (Ghostty tab)' })).toBeDefined()
  await ui.unmount()
})

test('without claude-work, the background session runs claude', async ($, on) => {
  const { runs } = host(on, { SHELL: '/bin/bash' }, false)
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const [button] = await ui.findAll({ type: 'Button', text: 'receiving-code-review' })
  await ui.press({ key: String(button?.key) })

  expect(runs.find(argv => argv[0] === '/bin/bash')).toEqual(['/bin/bash', '+m', '-ic', 'command -v claude-work'])
  expect(runs.at(-1)?.[3]?.startsWith("claude --bg --name 'receiving-code-review: Off-by-one")).toBe(true)
  await ui.unmount()
})

test('when the background session fails to start, a button starts a background agent instead', async ($, on) => {
  const { runs } = host(on, {}, true, false)
  const spawns: { prompt: string; cwd?: string | undefined }[] = []
  on('agent.spawn', (_, e) => (spawns.push(e), { model: 'sonnet', agentId: 'agent-1' }))
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const [button] = await ui.findAll({ type: 'Button', text: 'receiving-code-review' })
  await ui.press({ key: String(button?.key) })

  expect(spawns[0]?.prompt).toContain('`superpowers:receiving-code-review`')
  expect(spawns[0]?.prompt).toContain('Off-by-one drops the last row')
  expect(spawns[0]?.prompt).toContain('`jacks-skills:merge-back`')
  // The agent reuses the worktree the background session would have had.
  expect(spawns[0]?.cwd).toMatch(WORKTREE)
  expect(gitRuns(runs, 'worktree')).toHaveLength(1)
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
  expect(gitRuns(runs, 'worktree')).toEqual([])
  expect(fills[0]).toContain('background agent')
  expect(fills[0]).toContain('`jacks-skills:receiving-feedback`')
  expect(fills[0]).toContain('Off-by-one drops the last row')
  expect(await ui.find({ type: 'Text', text: /prompt box, press Enter/ })).toBeDefined()
  await ui.unmount()
})

test('a send that throws says why in a toast, and removes the worktree it added', async ($, on) => {
  const { runs } = host(on, {}, true, false)
  const toasts: string[] = []
  on('ui.toast', (_, e) => (toasts.push(e.text), { value: undefined }))
  // Nothing answers agent.spawn, so the fallback rejects.
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const [button] = await ui.findAll({ type: 'Button', text: 'receiving-code-review' })
  await ui.press({ key: String(button?.key) })

  expect(toasts.at(-1)?.startsWith('Send failed: ')).toBe(true)
  expect(gitRuns(runs, 'worktree').map(argv => argv.slice(2, 4))).toEqual([
    ['add', '--track'],
    ['remove', '--force'],
  ])
  expect(gitRuns(runs, 'branch')[0]?.slice(2, 3)).toEqual(['-D'])
  await ui.unmount()
})

test('a tab that does not open removes its worktree, and the finding stays unsent', async ($, on) => {
  const { runs } = host(on, { TERM_PROGRAM: 'ghostty' }, true, true, '', false)
  on('ui.toast', () => ({ value: undefined }))
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const [tab] = await ui.findAll({ type: 'Button', text: 'Run receiving-feedback in Ghostty tab' })
  await ui.press({ key: String(tab?.key) })

  const [add, remove] = gitRuns(runs, 'worktree')
  expect(remove?.slice(2)).toEqual(['remove', '--force', add?.[6]])
  expect(gitRuns(runs, 'branch')[0]).toEqual(['git', 'branch', '-D', add?.[5]])
  expect(await ui.find({ type: 'Text', text: /^sent to/ })).toBeUndefined()
  await ui.unmount()
})

test('with uncommitted changes, a button refuses with a toast and starts nothing', async ($, on) => {
  const { runs } = host(on, {}, true, true, ' M src/app.py\n')
  const toasts: string[] = []
  on('ui.toast', (_, e) => (toasts.push(e.text), { value: undefined }))
  await $.tool.call({ tool: 'ReportFindings', findings: [FINDING] })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const [button] = await ui.findAll({ type: 'Button', text: 'receiving-feedback' })
  await ui.press({ key: String(button?.key) })

  expect(toasts.at(-1)).toMatch(/^Commit or stash your changes first/)
  expect(gitRuns(runs, 'worktree')).toEqual([])
  expect(runs.some(argv => argv.at(-1)?.includes(' --bg'))).toBe(false)
  expect(await ui.find({ type: 'Button', text: 'receiving-feedback' })).toBeDefined()
  await ui.unmount()
})
