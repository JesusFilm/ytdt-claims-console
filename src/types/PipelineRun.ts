// types/PipelineRun.ts
export interface PipelineRun {
  id: string
  startTime: Date
  status: "running" | "completed" | "failed" | "cancelled" | "timeout"
  duration?: number
  files: {
    claims_matter_entertainment?: string
    claims_matter_2?: string
    mcnVerdicts?: string
    jfmVerdicts?: string
  }
  results?: {
    claimsProcessed?: {
      matter_entertainment?: { 
        total: number
        new: number
        invalidMCIDs: Array<Record<string, any>>
        invalidLanguageIDs: Array<Record<string, any>>
      }
      matter_2?: { 
        total: number
        new: number
        invalidMCIDs: Array<Record<string, any>>
        invalidLanguageIDs: Array<Record<string, any>>
      }
    }
    mcnVerdicts?: {
      processed: number
      invalidMCIDs: Array<Record<string, any>>
      invalidLanguageIDs: Array<Record<string, any>>
    }
    jfmVerdicts?: {
      processed: number
      invalidMCIDs: Array<Record<string, any>>
      invalidLanguageIDs: Array<Record<string, any>>
    }
    exports?: Record<string, { rows: number; path: string }>
    driveUploads?: Array<{ name: string; size: number; rows: number }>
    driveFolderUrl?: string
  }
  error?: string
  startedSteps: Array<{
    name: string
    title: string
    description: string
    status: "completed" | "error" | "skipped"
    timestamp: Date
    duration?: number
    error?: string
  }>
}
