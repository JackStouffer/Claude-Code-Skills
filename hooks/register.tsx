import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, UiPressArgument } from 'claude-code'

import type { Finding } from '../types'
import { registerCommentCop } from './comment-cop'
import { PLAN_COMMAND, PLAN_TOOL_DEFINITION, registerPlanProgress } from './plan-progress'

const PANE = 'review-board'
const REPORT_TOOL = 'mcp__jacks-skills__report_review_findings'
const findings = atom({ plugin: 'jacks-skills', key: 'findings' } as const, [])
// The last skill to start that reports through the built-in ReportFindings tool.
const reporter = atom({ plugin: 'jacks-skills', key: 'reporter' } as const, 'code-review')

const REPORTFINDINGS_SKILLS = new Set(['code-review', 'test-audit'])
const INSTRUCTED_SKILLS = new Set(['ce-code-review', 'ce-doc-review', 'ponytail-review', 'ponytail-audit'])

const FEEDBACK = 'jacks-skills:receiving-feedback'
const CODE_REVIEW = 'superpowers:receiving-code-review'
const SEND_BUTTONS = [
  { skill: FEEDBACK, isTab: false, label: 'receiving-feedback' },
  { skill: CODE_REVIEW, isTab: false, label: 'receiving-code-review' },
]
const GHOSTTY_BUTTONS = [
  { skill: CODE_REVIEW, isTab: true, label: 'Run receiving-code-review in Ghostty tab' },
  { skill: FEEDBACK, isTab: true, label: 'Run receiving-feedback in Ghostty tab' },
  { skill: CODE_REVIEW, isTab: false, label: 'Run receiving-code-review in bg agent' },
  { skill: FEEDBACK, isTab: false, label: 'Run receiving-feedback in bg agent' },
]

const OPEN_GHOSTTY_TAB = `on run argv
tell application "Ghostty"
  set cfg to new surface configuration
  set initial working directory of cfg to item 1 of argv
  set initial input of cfg to item 2 of argv
  new tab in front window with configuration cfg
  activate
end tell
end run`

// A worktree inside the checkout shows as untracked there, which would fail the next send's clean-tree check.
const EXCLUDE_WORKTREES = `git check-ignore -q .claude/worktrees/x && exit
f=$(git rev-parse --git-path info/exclude) && mkdir -p "$(dirname "$f")" && echo /.claude/worktrees/ >> "$f"`

type RawFinding = Omit<Finding, 'id' | 'source' | 'sentTo'>
interface Worktree {
  path: string
  branch: string
  base: string
}

const bareName = (skill: string) => skill.slice(skill.lastIndexOf(':') + 1)

const reportInstruction = (skill: string) => `

---
When your findings are final, call the \`${REPORT_TOOL}\` tool once with \`source: "${skill}"\` and every finding in your final report, in the same order. Put the rationale, failure scenario and suggested fix in \`detail\`, verbatim. Still give your normal output.`

const isRawFinding = (value: unknown): value is RawFinding =>
  typeof value === 'object' && value !== null && typeof (value as { summary?: unknown }).summary === 'string'

async function setFindings($: EngineInterface, fn: (list: Finding[]) => Finding[]) {
  await update($, findings, fn)
  // A pane carried over from a prior session has no live state subscription, so its frame
  // stays stale on an update until an unrelated event repaints it. Force the redraw.
  $.ui.invalidate('ui.render')
}

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
  await setFindings($, list => [...list.filter(one => one.source !== source), ...batch].slice(-100))

  const opened = await $.ui.open({ id: PANE, title: 'Review findings' })
  if (!opened.isPlaced) $.ui.toast(`${batch.length} findings from ${source}: run /review-board`)

  return batch.length
}

const location = (f: Finding) => (f.file ? ` at \`${f.file}${f.line ? `:${f.line}` : ''}\`` : '')

const findingText = (f: Finding) =>
  [`Review finding from \`${f.source}\`${location(f)}:`, f.summary, f.detail].filter(Boolean).join('\n\n')

const agentLabel = (f: Finding, skill: string) => `${bareName(skill)}: ${f.summary.slice(0, 40)}`

const shellQuote = (text: string) => `'${text.replaceAll("'", `'\\''`)}'`

// claude-work can be a shell function (a wrapper that sets credentials), which only an interactive shell sees.
// Job control off (+m): with it on, the shell takes the terminal's foreground from the TUI, which then exits on EIO.
const interactive = (shell: string, command: string) => [shell, '+m', '-ic', command]

async function claudeCommand($: EngineInterface) {
  const shell = (await $.env.get('SHELL')) ?? '/bin/sh'
  const found = await $.process
    .run(interactive(shell, 'command -v claude-work'), { timeoutMs: 5000 })
    .catch(() => undefined)

  return found?.exitCode === 0 ? 'claude-work' : 'claude'
}

// ponytail: ps joins argv with spaces, so a --plugin-dir path that holds a space is cut at it.
async function parentPluginDirs($: EngineInterface) {
  const ps = await $.process.run(['sh', '-c', 'ps -o args= -p $PPID']).catch(() => undefined)

  return [...(ps?.stdout ?? '').matchAll(/--plugin-dir(?:=|\s+)(\S+)/g)].flatMap(match => match[1] ?? [])
}

const git = ($: EngineInterface, args: string[]) => $.process.run(['git', ...args]).catch(() => undefined)

// The session works on its own branch, which tracks the current one: that upstream is where merge-back merges it.
async function addWorktree($: EngineInterface, f: Finding): Promise<Worktree | undefined> {
  const [root, base] =
    (await git($, ['rev-parse', '--show-toplevel', '--abbrev-ref', 'HEAD']))?.stdout.split('\n') ?? []
  if (!root || !base || base === 'HEAD') {
    $.ui.toast('Check out a branch first: the review session branches off it', { timeoutMs: 8000 })
    return
  }
  // The worktree starts at the last commit, so the session would not see uncommitted changes.
  if ((await git($, ['status', '--porcelain']))?.stdout !== '') {
    $.ui.toast('Commit or stash your changes first: the review session starts from the last commit', {
      timeoutMs: 8000,
    })
    return
  }
  await $.process.run(['sh', '-c', EXCLUDE_WORKTREES], { cwd: root }).catch(() => undefined)
  const worktree = { path: `${root}/.claude/worktrees/review-${f.id}`, branch: `review/${f.id}`, base }
  const added = await git($, ['worktree', 'add', '--track', '-b', worktree.branch, worktree.path, base])
  if (added?.exitCode !== 0) {
    $.ui.toast(`Could not add a worktree: ${added?.stderr.trim() ?? 'git did not run'}`, { timeoutMs: 8000 })
    return
  }

  return worktree
}

// The worktree holds no work yet when its session fails to start, so forcing its removal loses nothing.
async function removeWorktree($: EngineInterface, worktree: Worktree) {
  await git($, ['worktree', 'remove', '--force', worktree.path])
  await git($, ['branch', '-D', worktree.branch])
}

const mergeNote = (worktree: Worktree) =>
  `This session works in its own git worktree, on branch \`${worktree.branch}\` off \`${worktree.base}\`. When the user says the work is done, run the \`jacks-skills:merge-back\` skill.`

// The tab's initial input is typed into its shell, so the multi-line prompt goes through a file.
async function openGhosttyTab($: EngineInterface, f: Finding, skill: string, worktree: Worktree) {
  const promptPath = `/tmp/review-board/${f.id}.md`
  await $.fs.write(promptPath, `/${skill} ${findingText(f)}`)
  const flags = (await parentPluginDirs($)).map(dir => ` --plugin-dir ${shellQuote(dir)}`).join('')
  const launch = `${await claudeCommand($)}${flags} --append-system-prompt ${shellQuote(mergeNote(worktree))} "$(cat ${promptPath})"\n`
  const ran = await $.process.run(['osascript', '-e', OPEN_GHOSTTY_TAB, worktree.path, launch]).catch(() => undefined)
  if (ran?.exitCode !== 0) $.ui.toast('Could not open a Ghostty tab', { timeoutMs: 8000 })

  return ran?.exitCode === 0
}

// `claude --bg` starts a session in the background, listed in the agents view (`claude agents`).
async function startBackgroundSession($: EngineInterface, f: Finding, skill: string, worktree: Worktree) {
  const flags = (await parentPluginDirs($)).map(dir => ` --plugin-dir ${shellQuote(dir)}`).join('')
  const shell = (await $.env.get('SHELL')) ?? '/bin/sh'
  const launch = `${await claudeCommand($)} --bg --name ${shellQuote(agentLabel(f, skill))}${flags} --append-system-prompt ${shellQuote(mergeNote(worktree))} ${shellQuote(`/${skill} ${findingText(f)}`)}`
  const ran = await $.process
    .run(interactive(shell, launch), { cwd: worktree.path, timeoutMs: 15000 })
    .catch(() => undefined)

  return ran?.exitCode === 0
}

// The desktop Code tab does not show the agents view, so there the press drafts a request in the prompt box: sent by
// the person, it starts a background agent listed in this session's tasks, at the cost of this session's context.
async function draftAgentRequest($: EngineInterface, f: Finding, skill: string) {
  const filled = await $.prompt.fill({
    text: `Start a background agent that runs the \`${skill}\` skill on this review finding and follows it:\n\n${findingText(f)}`,
  })
  if (!filled.isFilled) $.ui.toast(`Could not fill the prompt box${filled.refusal ? ` (${filled.refusal})` : ''}`)

  return filled.isFilled
}

// If the background session does not start, a background subagent is the separate context, listed under tasks.
async function spawnAgent($: EngineInterface, f: Finding, skill: string, worktree: Worktree) {
  const spawned = await $.agent.spawn({
    description: agentLabel(f, skill),
    prompt: `Use the Skill tool to run the \`${skill}\` skill on this finding, then follow it:\n\n${findingText(f)}\n\n${mergeNote(worktree)}`,
    cwd: worktree.path,
  })
  if (spawned.deny !== undefined) $.ui.toast(`Could not start an agent: ${spawned.deny}`, { timeoutMs: 8000 })

  return spawned.deny === undefined
}

async function launchInWorktree($: EngineInterface, f: Finding, skill: string, isTab: boolean, worktree: Worktree) {
  if (isTab) return (await openGhosttyTab($, f, skill, worktree)) ? `${skill} (Ghostty tab)` : undefined
  if (await startBackgroundSession($, f, skill, worktree)) return `${skill} (agents view)`

  return (await spawnAgent($, f, skill, worktree)) ? `${skill} (background agent)` : undefined
}

async function sendFinding(
  $: EngineInterface,
  f: Finding,
  skill: string,
  isTab: boolean,
  surface: UiPressArgument['surface'],
) {
  let sentTo: string | undefined
  // ponytail: the desktop request runs in this session's checkout; a worktree there needs the Agent tool to take a cwd.
  if (!isTab && surface === 'desktop') {
    sentTo = (await draftAgentRequest($, f, skill)) ? `${skill} (prompt box, press Enter)` : undefined
  } else {
    const worktree = await addWorktree($, f)
    if (!worktree) return
    sentTo = await launchInWorktree($, f, skill, isTab, worktree).catch(async (err: unknown) => {
      await removeWorktree($, worktree)
      throw err
    })
    if (!sentTo) await removeWorktree($, worktree)
  }
  if (sentTo) await update($, findings, list => list.map(one => (one.id === f.id ? { ...one, sentTo } : one)))
}

// A button's press has no caller to report to, so a failed send says why in a toast.
const sendFailed = ($: EngineInterface) => (err: unknown) => {
  $.ui.toast(`Send failed: ${err instanceof Error ? err.message : String(err)}`, { timeoutMs: 10000 })
}

export const register: Register = on => {
  registerCommentCop(on)
  registerPlanProgress(on)

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'review-board', description: 'Show the review findings board' })
    await $.command.register(PLAN_COMMAND)
    await $.tool.register(PLAN_TOOL_DEFINITION)
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

    // A review-board pane left open by a prior session shows that session's last frame; repaint it
    // against this session's findings instead of waiting for a scroll to force the redraw.
    $.ui.invalidate('ui.render')

    return next(e)
  })

  on('command.run', { command: 'review-board' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Review findings', focus: true })

    return { text: 'Review board opened. Tab moves between buttons, Enter presses one, Esc returns to the prompt.' }
  })

  on('skill.prompt', async ($, e, next) => {
    const out = await next(e)
    const skill = bareName(e.skill)
    if (REPORTFINDINGS_SKILLS.has(skill)) await update($, reporter, () => skill)

    return INSTRUCTED_SKILLS.has(skill) ? { text: out.text + reportInstruction(skill) } : out
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
        await read($, reporter),
        e.findings.map(one => ({
          file: one.file,
          line: one.line,
          severity: one.verdict ?? one.category,
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
    // The focus ring starts on nothing; give it a button so Enter acts at once.
    const firstOpen = list.find(f => !f.sentTo)
    const isGhostty = e.surface === 'terminal' && (await $.env.get('TERM_PROGRAM')) === 'ghostty'
    const buttons = isGhostty ? GHOSTTY_BUTTONS : SEND_BUTTONS

    return (
      <Box flexDirection="column" gap={1}>
        <Text dimColor>
          {e.props.isFocused
            ? 'Tab moves between buttons · Enter presses · Esc returns to the prompt'
            : 'Run /review-board to use the buttons, or press ctrl+x, release, then Tab'}
        </Text>
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
              <Box flexDirection="column">
                <Button
                  key={`ignore:${f.id}`}
                  onPress={() => void setFindings($, all => all.filter(one => one.id !== f.id))}
                >
                  Ignore
                </Button>
                {buttons.map((button, i) => (
                  <Button
                    key={`${button.isTab ? 'tab' : 'send'}:${bareName(button.skill)}:${f.id}`}
                    {...(f === firstOpen && i === 0 && { autoFocus: true })}
                    onPress={press =>
                      void sendFinding($, f, button.skill, button.isTab, press.surface).catch(sendFailed($))
                    }
                  >
                    {button.label}
                  </Button>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    )
  })
}
