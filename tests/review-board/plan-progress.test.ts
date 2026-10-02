import { expect, mock, test } from 'claude-code/testing'

const PLAN_TOOL = 'mcp__jacks-skills__update_plan_progress'

const PANE = {
  plugin: 'jacks-skills',
  component: 'Pane',
  requestId: 'plan-progress',
  surface: 'terminal',
  props: {
    title: 'Plan progress',
    isFocused: false,
    bodyColumns: 28,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

test('the plan tool draws each status, a spinner and a progress bar', async ($, on) => {
  const clock = mock.clock(on)
  const opens: string[] = []
  on('ui.open', (_, e) => (opens.push(e.id), { value: { isPlaced: true } }))

  const subjects = ['Write the parser', 'Wire the CLI', 'Update docs']
  await $.tool.call({ tool: PLAN_TOOL, steps: subjects.map(subject => ({ subject, status: 'pending' })) })
  expect(opens).toEqual(['plan-progress'])
  await $.tool.call({
    tool: PLAN_TOOL,
    steps: [
      { subject: subjects[0], status: 'completed' },
      { subject: subjects[1], status: 'in_progress' },
      { subject: subjects[2], status: 'pending' },
    ],
  })
  // Only a plan's start opens the pane, so a pane the user closed stays closed.
  expect(opens).toEqual(['plan-progress'])

  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: '✓ Write the parser' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '⠋ Wire the CLI' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: '☐ Update docs' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: `${'█'.repeat(7)}${'░'.repeat(13)} 1/3` })).toBeDefined()

  await clock.advance(100)
  expect(await ui.find({ type: 'Text', text: '⠙ Wire the CLI' })).toBeDefined()
  await ui.unmount()
})

test("a plan's first call opens the pane even when a step has started", async ($, on) => {
  const opens: string[] = []
  on('ui.open', (_, e) => (opens.push(e.id), { value: { isPlaced: true } }))

  await $.tool.call({ tool: PLAN_TOOL, steps: [{ subject: 'One', status: 'in_progress' }] })
  expect(opens).toEqual(['plan-progress'])
})

test('a completed plan says how to close the pane, and its button closes it', async ($, on) => {
  const closes: string[] = []
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.close', (_, e) => (closes.push(e.id), { value: undefined }))

  await $.tool.call({ tool: PLAN_TOOL, steps: [{ subject: 'One', status: 'completed' }] })
  const ui = await $.ui.mount(PANE)
  expect(await ui.find({ type: 'Text', text: /ctrl\+x x/ })).toBeDefined()
  const close = await ui.find({ type: 'Button', text: 'Close' })
  await ui.press({ key: String(close?.key) })
  expect(closes).toEqual(['plan-progress'])
  await ui.unmount()
})

test('the plan tool refuses a step with an unknown status', async $ => {
  const ran = await $.tool.call({ tool: PLAN_TOOL, steps: [{ subject: 'One', status: 'done' }] })
  expect(ran.deny).toContain('status one of pending, in_progress, completed')
})

test('Clawd shows in the fullscreen terminal and on desktop, not on the main screen', async ($, on) => {
  on('ui.open', () => ({ value: { isPlaced: true } }))
  await $.tool.call({ tool: PLAN_TOOL, steps: [{ subject: 'One', status: 'in_progress' }] })
  const props = { ...PANE.props, bodyColumns: 40 }
  const viewport = (isFullscreen: boolean) => ({ columns: 160, rows: 50, isFullscreen })

  const main = await $.ui.mount({ ...PANE, props, viewport: viewport(false) })
  expect(await main.find({ type: 'Raster' })).toBeUndefined()
  await main.unmount()

  const fullscreen = await $.ui.mount({ ...PANE, props, viewport: viewport(true) })
  expect(await fullscreen.find({ type: 'Raster', key: 'clawd' })).toBeDefined()
  await fullscreen.unmount()

  const desktop = await $.ui.mount({ ...PANE, surface: 'desktop', props })
  expect(await desktop.find({ type: 'Svg' })).toBeDefined()
  await desktop.unmount()
})
