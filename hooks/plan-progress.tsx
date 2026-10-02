import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Timer } from 'claude-code'

import type { PlanStep } from '../types'

const PANE = 'plan-progress'
const PLAN_TOOL = 'mcp__jacks-skills__update_plan_progress'
const STATUSES = ['pending', 'in_progress', 'completed']
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
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
  const isRunning = list.some(step => step.status === 'in_progress')
  if (isRunning && !spinner) {
    spinner = $.clock.every(100, () => void update($, frame, n => (n + 1) % FRAMES.length))
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
    await setSteps(
      $,
      input.steps.map(({ subject, status }) => ({ subject, status })),
    )
    // Open when a plan starts (every step pending) only, so a pane the user closed stays closed.
    if (input.steps.every(step => step.status === 'pending')) {
      const opened = await $.ui.open({ id: PANE, title: 'Plan progress' })
      if (!opened.isPlaced) $.ui.toast('Plan progress: run /plan-progress')
    }

    return { result: `Plan progress shows ${input.steps.length} steps.` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const list = await read($, steps)
    if (list.length === 0) return <Text dimColor>No plan running.</Text>
    const spin = FRAMES[await read($, frame)]
    const done = list.filter(step => step.status === 'completed').length
    const width = Math.max(10, e.props.bodyColumns - 8)

    return (
      <Box flexDirection="column" gap={1}>
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
      </Box>
    )
  })
}
