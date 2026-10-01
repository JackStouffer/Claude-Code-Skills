import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Finding } from '../types'

const PANE = 'review-board'
const REPORT_TOOL = 'mcp__jacks-skills__report_review_findings'
const findings = atom({ plugin: 'jacks-skills', key: 'findings' } as const, [])

// code-review is absent: it already reports through the built-in ReportFindings tool.
const INSTRUCTED_SKILLS = new Set([
  'ce-code-review',
  'ce-doc-review',
  'ponytail-review',
  'ponytail-audit',
  'test-audit',
])

const OPEN_GHOSTTY_TAB = `on run argv
tell application "Ghostty"
  set cfg to new surface configuration
  set initial working directory of cfg to item 1 of argv
  set initial input of cfg to item 2 of argv
  new tab in front window with configuration cfg
  activate
end tell
end run`

type RawFinding = Omit<Finding, 'id' | 'source' | 'sentTo'>

const bareName = (skill: string) => skill.slice(skill.lastIndexOf(':') + 1)

const reportInstruction = (skill: string) => `

---
When your findings are final, call the \`${REPORT_TOOL}\` tool once with \`source: "${skill}"\` and every finding in your final report, in the same order. Put the rationale, failure scenario and suggested fix in \`detail\`, verbatim. Still give your normal output.`

const isRawFinding = (value: unknown): value is RawFinding =>
  typeof value === 'object' && value !== null && typeof (value as { summary?: unknown }).summary === 'string'

async function addBatch($: EngineInterface, source: string, raw: readonly RawFinding[]) {
  const stamp = Date.now().toString(36)
  const batch: Finding[] = raw.map((one, i) => ({
    id: `${stamp}-${i}`,
    source,
    file: one.file,
    line: one.line,
    severity: one.severity,
    summary: one.summary,
    detail: one.detail,
  }))
  // A rerun of the same review supersedes its earlier findings.
  await update($, findings, list => [...list.filter(one => one.source !== source), ...batch].slice(-100))

  const opened = await $.ui.open({ id: PANE, title: 'Review findings' })
  if (!opened.isPlaced) $.ui.toast(`${batch.length} findings from ${source}: run /review-board`)

  return batch.length
}

const location = (f: Finding) => (f.file ? ` at \`${f.file}${f.line ? `:${f.line}` : ''}\`` : '')

const findingText = (f: Finding) =>
  [`Review finding from \`${f.source}\`${location(f)}:`, f.summary, f.detail].filter(Boolean).join('\n\n')

const shellQuote = (text: string) => `'${text.replaceAll("'", `'\\''`)}'`

// claude-work can be a shell function (a wrapper that sets credentials), which only an interactive shell sees.
async function claudeCommand($: EngineInterface) {
  const shell = (await $.env.get('SHELL')) ?? '/bin/sh'
  const found = await $.process
    .run([shell, '-ic', 'command -v claude-work'], { timeoutMs: 5000 })
    .catch(() => undefined)

  return found?.exitCode === 0 ? 'claude-work' : 'claude'
}

// ponytail: ps joins argv with spaces, so a --plugin-dir path that holds a space is cut at it.
async function parentPluginDirs($: EngineInterface) {
  const ps = await $.process.run(['sh', '-c', 'ps -o args= -p $PPID']).catch(() => undefined)

  return [...(ps?.stdout ?? '').matchAll(/--plugin-dir(?:=|\s+)(\S+)/g)].flatMap(match => match[1] ?? [])
}

async function openGhosttyTab($: EngineInterface, f: Finding, skill: string) {
  if ((await $.env.get('TERM_PROGRAM')) !== 'ghostty') return false

  const promptPath = `/tmp/review-board/${f.id}.md`
  await $.fs.write(promptPath, `/${skill} ${findingText(f)}`)
  const flags = (await parentPluginDirs($)).map(dir => ` --plugin-dir ${shellQuote(dir)}`).join('')
  const launch = `${await claudeCommand($)}${flags} "$(cat ${promptPath})"\n`
  const ran = await $.process
    .run(['osascript', '-e', OPEN_GHOSTTY_TAB, await $.session.cwd(), launch])
    .catch(() => undefined)

  return ran?.exitCode === 0
}

// Outside Ghostty, a background subagent is the separate context: its own window, listed under tasks.
async function sendFinding($: EngineInterface, f: Finding, skill: string) {
  let sentTo = skill
  if (!(await openGhosttyTab($, f, skill))) {
    const spawned = await $.agent.spawn({
      description: `${bareName(skill)}: ${f.summary.slice(0, 40)}`,
      prompt: `Use the Skill tool to run the \`${skill}\` skill on this finding, then follow it:\n\n${findingText(f)}`,
    })
    if (spawned.deny !== undefined) {
      $.ui.toast(`Could not start an agent: ${spawned.deny}`, { timeoutMs: 8000 })
      return
    }
    sentTo = `${skill} (background agent)`
  }
  await update($, findings, list => list.map(one => (one.id === f.id ? { ...one, sentTo } : one)))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'review-board', description: 'Show the review findings board' })
    await $.tool.register({
      name: 'report_review_findings',
      description: "Records a review's final findings on the user's review board.",
      inputSchema: {
        type: 'object',
        required: ['source', 'findings'],
        properties: {
          source: { type: 'string', description: 'The review skill that produced the findings' },
          findings: {
            type: 'array',
            items: {
              type: 'object',
              required: ['summary'],
              properties: {
                file: { type: 'string' },
                line: { type: 'integer' },
                severity: { type: 'string' },
                summary: { type: 'string', description: 'One sentence' },
                detail: { type: 'string', description: 'Rationale, failure scenario and suggested fix' },
              },
            },
          },
        },
      },
    })

    return next(e)
  })

  on('command.run', { command: 'review-board' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Review findings' })

    return { text: 'Review board opened.' }
  })

  on('skill.prompt', async (_, e, next) => {
    const out = await next(e)

    return INSTRUCTED_SKILLS.has(bareName(e.skill)) ? { text: out.text + reportInstruction(bareName(e.skill)) } : out
  })

  on('tool.call', { tool: REPORT_TOOL }, async ($, e) => {
    const input = e as unknown as { source?: unknown; findings?: unknown }
    if (typeof input.source !== 'string' || !Array.isArray(input.findings)) {
      return { deny: '`source` (string) and `findings` (array) are required.' }
    }
    const count = await addBatch($, input.source, (input.findings as unknown[]).filter(isRawFinding))

    return { result: `Recorded ${count} findings on the review board.` }
  })

  on('tool.call', { tool: 'ReportFindings' }, async ($, e, next) => {
    const ran = await next(e)
    // Findings with an outcome are a re-report after fixes, not a new review.
    if (ran.deny === undefined && !e.findings.some(one => one.outcome)) {
      await addBatch(
        $,
        'code-review',
        e.findings.map(one => ({
          file: one.file,
          line: one.line,
          severity: one.verdict,
          summary: one.summary,
          detail: one.failure_scenario,
        })),
      )
    }

    return ran
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const list = await read($, findings)
    if (list.length === 0) return <Text dimColor>No review findings yet.</Text>

    return (
      <Box flexDirection="column" gap={1}>
        {list.map(f => (
          <Box key={f.id} flexDirection="column">
            <Text bold={!f.sentTo} dimColor={Boolean(f.sentTo)}>
              {f.severity ? `[${f.severity}] ` : ''}
              {f.summary}
            </Text>
            <Text dimColor>
              {f.source}
              {f.file ? ` · ${f.file}${f.line ? `:${f.line}` : ''}` : ''}
            </Text>
            {f.sentTo ? (
              <Text dimColor>sent to {f.sentTo}</Text>
            ) : (
              <Box flexDirection="row" gap={1}>
                <Button
                  key={`ignore:${f.id}`}
                  onPress={() => void update($, findings, all => all.filter(one => one.id !== f.id))}
                >
                  Ignore
                </Button>
                <Button
                  key={`feedback:${f.id}`}
                  onPress={() => void sendFinding($, f, 'jacks-skills:receiving-feedback')}
                >
                  receiving-feedback
                </Button>
                <Button
                  key={`code-review:${f.id}`}
                  onPress={() => void sendFinding($, f, 'superpowers:receiving-code-review')}
                >
                  receiving-code-review
                </Button>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    )
  })
}
