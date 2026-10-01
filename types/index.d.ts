export interface Finding {
  id: string
  source: string
  file?: string | undefined
  line?: number | undefined
  severity?: string | undefined
  summary: string
  detail?: string | undefined
  sentTo?: string | undefined
}

declare module 'claude-code' {
  interface PluginState {
    'jacks-skills': { findings: Finding[] }
  }
}
