"use client"

import { FC, useCallback, useEffect, useState } from "react"

import { AlertCircle, CheckCircle, Clock, KeyRound, Upload } from "lucide-react"

import RefreshButton from "@/components/RefreshButton"
import type {
  ClaimsIngestAttempt,
  ClaimsIngestStatus,
} from "@/types/ClaimsIngest"
import { authFetch } from "@/utils/auth"
import { formatTimestamp } from "@/utils/formatTime"

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
              label="Latest snapshot"
              value={snapshotDate(last) ?? "—"}
              hint={
                last.endedAt
                  ? `ingested ${formatTimestamp(last.endedAt)}`
                  : undefined
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
                detail={
                  publishedAt(last) ? formatTimestamp(publishedAt(last)!) : "—"
                }
                done
              />
              <Step
                label="Ingested"
                detail={last.endedAt ? formatTimestamp(last.endedAt) : "—"}
                done
              />
              <Step
                label="Queued"
                detail={
                  queued != null ? `${queued.toLocaleString()} rows` : "—"
                }
                done={queued != null}
              />
              <Step label="Scoring" detail="waiting" done={false} />
            </div>

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
                  {formatTimestamp(attempt.startedAt)}
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
