// Shape returned by GET /api/claims-ingest/status on the pipeline API.
// One document per attempt of the daily YouTube Reporting API ingest.

export interface ClaimsReportRef {
  contentOwnerId: string
  reportId: string
  jobId?: string
  startTime: string // the day the snapshot covers
  createTime: string // when YouTube published it
}

export interface ClaimsProcessedCounts {
  total: number
  new: number
  invalidMCIDs?: number
  invalidLanguageIDs?: number
}

export interface ClaimsIngestAttempt {
  _id?: string
  status: "completed" | "failed" | "running" | "skipped" | "nothing_new"
  trigger?: "schedule" | "manual"
  startedAt: string
  endedAt?: string
  reason?: string
  error?: string | null
  authRequired?: boolean
  reports?: Record<string, ClaimsReportRef>
  results?: {
    claimsProcessed?: Record<string, ClaimsProcessedCounts>
    enrichShorts?: { checked: number; marked: number }
    asrQueue?: {
      rows?: number
      path?: string
      skipped?: string
      response?: { status?: string; rows?: number }
    }
  }
}

export interface ClaimsIngestStatus {
  enabled: boolean
  authRequired: boolean
  lastCompleted: ClaimsIngestAttempt | null
  recent: ClaimsIngestAttempt[]
}
