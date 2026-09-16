"use client"

import { FC, useCallback, useEffect, useState } from "react"

import { AlertCircle, CheckCircle, Clock, KeyRound, Upload } from "lucide-react"

import RefreshButton from "@/components/RefreshButton"
import type {
  ClaimsIngestAttempt,
  ClaimsIngestStatus,
  CollectorStatus,
} from "@/types/ClaimsIngest"
import { authFetch } from "@/utils/auth"

export interface ClaimsCollectionTabProps {
  // Manual upload is now the fallback, so the tab links to it rather than owning it
  onUploadManually?: () => void
}

const OWNER_LABELS: Record<string, string> = {
  matter_entertainment: "Matter Entertainment",
  matter_2: "Matter 2",
}

// CLAIMS_INGEST_TIME_UTC on the API; the collector downstream runs at 08:15 UTC
const INGEST_HOUR_UTC = 6

export function nextRunUtc(now: Date = new Date()): Date {
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      INGEST_HOUR_UTC
    )
  )
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
  return next
}

export function timeUntil(target: Date, now: Date = new Date()): string {
  const minutes = Math.max(
    0,
    Math.round((target.getTime() - now.getTime()) / 60000)
  )
  const hours = Math.floor(minutes / 60)
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`
}

// Report dates are YouTube's and the schedule is UTC, so render them in UTC
// rather than the viewer's zone — otherwise the same instant reads as two
// different days between a card and the timeline below it.
export function formatUtc(value?: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (isNaN(date.getTime())) return "—"
  return `${date.toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })} UTC`
}

export function daysOld(
  isoDate?: string | null,
  now: Date = new Date()
): number | null {
  if (!isoDate) return null
  const then = new Date(`${isoDate}T00:00:00Z`)
  if (isNaN(then.getTime())) return null
  return Math.max(0, Math.floor((now.getTime() - then.getTime()) / 86400000))
}

// Per video the collector stores the language YouTube's own speech recognition
// heard: caption track metadata only, never caption text, and nothing is
// transcribed. Evidence gathering, 180/day. Null when YT-Validator is
// unreachable, predates /asr/status, or has not run since.
export function audioLanguageProgress(collector?: CollectorStatus | null) {
  const run = collector?.collector
  if (!run || run.remaining == null) return null

  const total = run.queue_videos_needing_asr ?? collector?.queue?.rows
  const done = total != null ? Math.max(0, total - run.remaining) : null
  return {
    total,
    done,
    remaining: run.remaining,
    lastRun: run.last_run,
    stoppedReason: run.stopped_reason ?? null,
  }
}

function snapshotDate(attempt: ClaimsIngestAttempt | null): string | null {
  const starts = Object.values(attempt?.reports ?? {}).map((r) => r.startTime)
  if (!starts.length) return null
  return starts.sort().slice(-1)[0].slice(0, 10)
}

function publishedAt(attempt: ClaimsIngestAttempt | null): string | null {
  const created = Object.values(attempt?.reports ?? {}).map((r) => r.createTime)
  if (!created.length) return null
  return created.sort().slice(-1)[0]
}

function newClaims(attempt: ClaimsIngestAttempt | null): number {
  return Object.values(attempt?.results?.claimsProcessed ?? {}).reduce(
    (sum, counts) => sum + (counts.new || 0),
    0
  )
}

function scannedClaims(attempt: ClaimsIngestAttempt | null): number {
  return Object.values(attempt?.results?.claimsProcessed ?? {}).reduce(
    (sum, counts) => sum + (counts.total || 0),
    0
  )
}

const Metric: FC<{ label: string; value: string; hint?: string }> = ({
  label,
  value,
  hint,
}) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <p className="text-sm text-gray-600">{label}</p>
    <p className="text-2xl font-medium text-gray-900 mt-1">{value}</p>
    {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
  </div>
)

const Step: FC<{ label: string; detail: string; done: boolean }> = ({
  label,
  detail,
  done,
}) => (
  <div
    className={`pl-3 border-l-2 ${done ? "border-green-500" : "border-gray-300"}`}
  >
    <p
      className={`text-sm font-medium ${done ? "text-gray-900" : "text-gray-500"}`}
    >
      {label}
    </p>
    <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
  </div>
)

const ClaimsCollectionTab: FC<ClaimsCollectionTabProps> = ({
  onUploadManually,
}) => {
  const [status, setStatus] = useState<ClaimsIngestStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await authFetch("/api/claims-ingest/status")
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      setStatus(await response.json())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  if (loading) {
    return <p className="text-gray-600">Loading collection status…</p>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <div>
          <p className="text-sm font-medium text-red-800">
            Couldn&apos;t load collection status
          </p>
          <p className="text-xs text-red-700 mt-0.5">{error}</p>
        </div>
      </div>
    )
  }

  const last = status?.lastCompleted ?? null
  const queued = last?.results?.asrQueue?.rows
  const next = nextRunUtc()
  const audio = audioLanguageProgress(status?.collector)
  const snapshot = snapshotDate(last)
  const age = daysOld(snapshot)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Claims collection
          </h2>
          <p className="text-sm text-gray-600">
            Claims arrive automatically from the YouTube Reporting API
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          {status?.enabled ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Scheduled
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-gray-500">
              <span className="w-2 h-2 bg-gray-400 rounded-full" />
              Paused
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Next run in {timeUntil(next)}
          </span>
          <RefreshButton onRefresh={fetchStatus} />
        </div>
      </div>

      {status?.authRequired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <KeyRound className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Sign-in expired — claims are no longer being collected
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              Someone needs to re-authorize the YouTube Reporting API on the
              pipeline VM. Until then the daily run fails and no new claims
              arrive.
            </p>
          </div>
        </div>
      )}

      {last ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Metric
              label="Claims as of"
              value={snapshot ?? "—"}
              hint={
                age == null
                  ? undefined
                  : age === 0
                    ? "today"
                    : `${age} day${age === 1 ? "" : "s"} old`
              }
            />
            <Metric
              label="New claims"
              value={newClaims(last).toLocaleString()}
              hint={`of ${scannedClaims(last).toLocaleString()} scanned`}
            />
            <Metric
              label="Queued for review"
              value={queued != null ? queued.toLocaleString() : "—"}
              hint={last.results?.asrQueue?.skipped ?? "sent to YT-Validator"}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">
              Collection timeline
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Step
                label="Published"
                detail={formatUtc(publishedAt(last))}
                done
              />
              <Step label="Ingested" detail={formatUtc(last.endedAt)} done />
              <Step
                label="Queued"
                detail={
                  queued != null ? `${queued.toLocaleString()} rows` : "—"
                }
                done={queued != null}
              />
              {/* A report's lifecycle ends here. Verdicts and languages are
                  decided in a separate monthly run, so they don't belong. */}
              <Step
                label="Audio language"
                detail={
                  audio
                    ? `${audio.done?.toLocaleString() ?? "—"} of ${
                        audio.total?.toLocaleString() ?? "—"
                      } videos`
                    : "not started"
                }
                done={audio?.remaining === 0}
              />
            </div>

            {audio && (
              <p className="text-xs text-gray-500 mt-3">
                As of the collector&apos;s last run
                {audio.lastRun ? ` (${formatUtc(audio.lastRun)})` : ""}, not
                live.
                {audio.stoppedReason === "quota" &&
                  " It stopped early on the daily quota, so more remain than the budget suggests."}
                {audio.stoppedReason === "outage" &&
                  " It stopped early after repeated lookup failures, so more remain than the budget suggests."}
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              {Object.entries(last.results?.claimsProcessed ?? {}).map(
                ([source, counts]) => (
                  <div
                    key={source}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600">
                      {OWNER_LABELS[source] ?? source}
                    </span>
                    <span className="text-gray-900">
                      <span className="font-medium">
                        {counts.new.toLocaleString()}
                      </span>{" "}
                      <span className="text-gray-500">
                        new of {counts.total.toLocaleString()}
                      </span>
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600">
            No claims have been collected yet. The first scheduled run will
            fetch the newest available snapshot.
          </p>
        </div>
      )}

      {status?.recent?.length ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-base font-medium text-gray-900 mb-3">
            Recent runs
          </h3>
          <div className="space-y-2">
            {status.recent.slice(0, 5).map((attempt, index) => (
              <div
                key={attempt._id ?? `${attempt.startedAt}-${index}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">
                  {formatUtc(attempt.startedAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  {attempt.status === "completed" && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {attempt.status === "failed" && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-gray-700">
                    {attempt.status === "nothing_new"
                      ? "no new snapshot"
                      : attempt.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-lg p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm font-medium text-gray-900">Manual upload</p>
            <p className="text-sm text-gray-600">
              Only needed if a snapshot is missing or predates the API&apos;s
              60-day retention
            </p>
          </div>
        </div>
        {onUploadManually && (
          <button
            onClick={onUploadManually}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Upload claims
          </button>
        )}
      </div>
    </div>
  )
}

export default ClaimsCollectionTab
