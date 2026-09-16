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

// An ingest as history returns it: the same attempt, summarised for a list.
// History renames startedAt/endedAt to startTime/endTime so ingests share the
// runs' field names — so they are omitted here, not inherited. Inheriting them
// let the list sort on startedAt, which history never sends: every ingest got
// a NaN sort key and sank below months-old runs.
export interface ClaimsIngestSummary
  extends Omit<ClaimsIngestAttempt, "startedAt" | "endedAt" | "reason"> {
  id: string
  kind: "ingest"
  startTime: string
  endTime?: string | null
  duration?: number
  reason?: string | null
}

// Pipeline runs carry a mode so a steps-filtered run isn't mistaken for a full
// one that skipped its work.
export type RunMode = "full" | "scoring" | "partial"

export interface HistoryStats {
  total: number
  successful: number
  failed: number
  ingests: {
    total: number
    completed: number
    nothingNew: number
    failed: number
  }
  medianDuration: {
    full: number | null
    scoring: number | null
    partial: number | null
  }
}

// YT-Validator's /asr/status, proxied by the pipeline because the browser
// cannot reach localhost:3001. Every block is an empty object until the
// collector has run at least once, so treat empty as "not started".
export interface CollectorStatus {
  queue?: {
    rows?: number
    written_at?: string
    has_licensed?: boolean
    has_triage?: boolean
  }
  cache?: { videos?: number; with_track?: number; no_track?: number }
  collector?: {
    last_run?: string
    looked_up?: number
    added?: number
    failed?: number
    // as of the last run, not live: recomputing per request is too expensive
    remaining?: number
    queue_videos_needing_asr?: number
    budget?: number
    stopped_reason?: "quota" | "outage" | null
    stopped_detail?: string
  }
  languages?: {
    tiers_live?: string[]
    trusted_asr_languages?: string[]
    artifact_trained_at?: string
  }
  version?: { branch?: string; commit?: string }
}

export interface ClaimsIngestStatus {
  enabled: boolean
  authRequired: boolean
  lastCompleted: ClaimsIngestAttempt | null
  recent: ClaimsIngestAttempt[]
  // absent when YT-Validator is unreachable or predates /asr/status
  collector?: CollectorStatus | null
  // when the pipeline fetched it, distinct from collector.collector.last_run
  collectorFetchedAt?: string | null
}
