// types/PipelineRun.ts
// How many ids are wrong, and how many rows they cost. Absent on runs from
// before the pipeline reported it, where only the row count is known.
export interface InvalidIdSummary {
  distinct: number
  rows: number
  byId: Array<{ id: string; rows: number; examples: string[] }>
}

export interface VerdictResult {
  processed: number
  invalidMCIDs: Array<Record<string, string | number>>
  invalidLanguageIDs: Array<Record<string, string | number>>
  invalidSummary?: {
    mcids: InvalidIdSummary
    languages: InvalidIdSummary
  }
  acrossAllClaims?: {
    invalidMCIDs: number
    invalidLanguageIDs: number
    // written beside the run's other exports, so the backlog can be downloaded
    files?: {
      invalidMCIDs: string | null
      invalidLanguageIDs: string | null
    }
  }
}

export interface PipelineRun {
  id: string
  startTime: Date
  status: "running" | "completed" | "failed" | "cancelled" | "timeout"
  duration?: number
  triggeredBy?: { source: "ui" | "slack"; user: string }
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
        invalidMCIDs: Array<Record<string, string | number>>
        invalidLanguageIDs: Array<Record<string, string | number>>
      }
      matter_2?: {
        total: number
        new: number
        invalidMCIDs: Array<Record<string, string | number>>
        invalidLanguageIDs: Array<Record<string, string | number>>
      }
    }
    mcnVerdicts?: VerdictResult
    jfmVerdicts?: VerdictResult
    enrichShorts?: {
      checked: number
      marked: number
    }
    exports?: Record<string, { rows: number; path: string }>
    // Written by the enrich_ml step; task_id lands as soon as the ML service
    // accepts the job, the rest when its webhook reports completion.
    mlEnrichment?: {
      task_id?: string
      started_at?: string
      status?: string
      num_results?: number
      error?: string
      // Set when the enriched CSV was produced but could not be copied to
      // Drive; the run still completes, so surface it rather than hide it.
      driveUploadError?: string
    }
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
