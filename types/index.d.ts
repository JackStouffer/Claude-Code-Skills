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

export interface PlanStep {
  subject: string
  status: 'pending' | 'in_progress' | 'completed'
}

declare module 'claude-code' {
  interface PluginState {
    'jacks-skills': {
      findings: Finding[]
      reporter: string
      planSteps: PlanStep[]
      planFrame: number
      copFiredAt: number
      copFrame: number
    }
  }
}
