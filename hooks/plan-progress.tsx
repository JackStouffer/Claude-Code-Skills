import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Timer } from 'claude-code'

import type { PlanStep } from '../types'
import { CLAWD_COLUMNS, CLAWD_ROWS, clawdCells, clawdSvg } from './clawd'

const PANE = 'plan-progress'
const PLAN_TOOL = 'mcp__jacks-skills__update_plan_progress'
const STATUSES = ['pending', 'in_progress', 'completed']
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
// One tick each 100ms, 60 to a cycle: the spinner shows tick % FRAMES.length, Clawd times taps and blinks on it.
const TICKS = 60
const steps = atom({ plugin: 'jacks-skills', key: 'planSteps' } as const, [])
const frame = atom({ plugin: 'jacks-skills', key: 'planFrame' } as const, 0)

let spinner: Timer | undefined

const isStep = (value: unknown): value is PlanStep =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { subject?: unknown }).subject === 'string' &&
  STATUSES.includes((value as { status?: unknown }).status as string)

async function setSteps($: EngineInterface, list: PlanStep[]) {
  await update($, steps, () => list)
  // A pane carried over from a prior session has no live state subscription, so its frame
  // stays stale on an update until an unrelated event repaints it. Force the redraw.
  $.ui.invalidate('ui.render')
  const isRunning = list.some(step => step.status === 'in_progress')
  if (isRunning && !spinner) {
    spinner = $.clock.every(100, () => void update($, frame, n => (n + 1) % TICKS))
  } else if (!isRunning && spinner) {
    spinner.cancel()
    spinner = undefined
  }
}

const bar = (done: number, total: number, width: number) => {
  const filled = total ? Math.round((done / total) * width) : 0

  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

// The plugin loads one hooks module, takes one unmatched session.start, and follows $ only within a file, so
// register.tsx registers these in its session.start and calls registerPlanProgress.
export const PLAN_COMMAND = { name: 'plan-progress', description: 'Show the executing-plans progress pane' }
export const PLAN_TOOL_DEFINITION = {
  name: 'update_plan_progress',
  description:
    "Shows the plan's steps and their statuses on the user's plan progress pane. Send every step each call; the list replaces the last one.",
  inputSchema: {
    type: 'object',
    required: ['steps'],
    properties: {
      steps: {
        type: 'array',
        items: {
          type: 'object',
          required: ['subject', 'status'],
          properties: {
            subject: { type: 'string', description: 'The plan task, in a few words' },
            status: { type: 'string', enum: STATUSES },
          },
        },
      },
    },
  },
}

export const registerPlanProgress = (on: On) => {
  on('command.run', { command: 'plan-progress' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Plan progress' })

    return { text: 'Plan progress pane opened.' }
  })

  on('tool.call', { tool: PLAN_TOOL }, async ($, e) => {
    const input = e as unknown as { steps?: unknown }
    if (!Array.isArray(input.steps) || !input.steps.every(isStep)) {
      return {
        deny: '`steps` must be an array of `{ subject, status }`, status one of pending, in_progress, completed.',
      }
    }
    const isFirst = (await read($, steps)).length === 0
    await setSteps(
      $,
      input.steps.map(({ subject, status }) => ({ subject, status })),
    )
    // Open when a plan starts (the first call, or every step pending) only, so a pane the user closed stays closed.
    if (isFirst || input.steps.every(step => step.status === 'pending')) {
      const opened = await $.ui.open({ id: PANE, title: 'Plan progress' })
      if (!opened.isPlaced) $.ui.toast('Plan progress: run /plan-progress')
    }

    return { result: `Plan progress shows ${input.steps.length} steps.` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const list = await read($, steps)
    if (list.length === 0) return <Text dimColor>No plan running.</Text>
    const tick = await read($, frame)
    const spin = FRAMES[tick % FRAMES.length]
    const done = list.filter(step => step.status === 'completed').length
    const mood = done === list.length ? 'happy' : 'typing'
    const alt = mood === 'happy' ? 'Clawd cheering' : 'Clawd typing at a laptop'
    // Fullscreen terminal and desktop only: the main screen's inline pane has no room to spare.
    let clawd = null
    if (e.surface === 'desktop') {
      const { Svg } = $.ui.resolve(e)
      clawd = <Svg source={clawdSvg(mood, tick)} alt={alt} />
    } else if (e.surface === 'terminal' && e.viewport?.isFullscreen === true && e.props.bodyColumns >= CLAWD_COLUMNS) {
      const { Raster } = $.ui.resolve(e)
      clawd = <Raster key="clawd" columns={CLAWD_COLUMNS} rows={CLAWD_ROWS} cells={clawdCells(mood, tick)} />
    }
    const width = Math.max(10, e.props.bodyColumns - 8)

    return (
      <Box flexDirection="column" gap={1}>
        {clawd && <Box justifyContent="center">{clawd}</Box>}
        <Box flexDirection="column">
          {list.map((step, i) => (
            <Text key={String(i)} dimColor={step.status === 'completed'} bold={step.status === 'in_progress'}>
              {step.status === 'completed' ? (
                <Text color="green">✓</Text>
              ) : step.status === 'in_progress' ? (
                <Text color="yellow">{spin}</Text>
              ) : (
                '☐'
              )}{' '}
              {step.subject}
            </Text>
          ))}
        </Box>
        <Text>
          {bar(done, list.length, width)} {done}/{list.length}
        </Text>
        {done === list.length && (
          <Box flexDirection="column">
            <Text dimColor>Plan complete. Close this pane with ctrl+x x, or:</Text>
            <Button key="close" role="dismiss" onPress={() => void $.ui.close({ id: PANE })}>
              Close
            </Button>
          </Box>
        )}
      </Box>
    )
  })
}
