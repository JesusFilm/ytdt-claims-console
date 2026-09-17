"use client"

import { FC, useCallback, useEffect, useState } from "react"

import { AlertCircle, CheckCircle, Clock, KeyRound, Upload } from "lucide-react"

import RefreshButton from "@/components/RefreshButton"
import type {
  ClaimsIngestAttempt,
  ClaimsIngestStatus,
  ClaimsOwnerSnapshot,
  CollectorStatus,
} from "@/types/ClaimsIngest"
import { authFetch } from "@/utils/auth"

export interface ClaimsCollectionTabProps {
  // Manual upload is now the fallback, so the tab links to it rather than owning it
  onUploadManually?: () => void
  // Opens an attempt on the history tab, where the full detail lives. Without
  // it the rows stay plain text rather than pretending to be clickable.
  onOpenIngest?: (ingestId: string) => void
}

const OWNER_LABELS: Record<string, string> = {
  matter_entertainment: "Matter Entertainment",
  matter_2: "Matter 2",
}

// CLAIMS_INGEST_TIME_UTC on the API; the collector downstream runs at 08:15 UTC
const INGEST_HOUR_UTC = 6
// yt-validator-asr-collect.timer on the VM
const COLLECTOR_TIME_UTC = "08:15"

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

// YT-Validator's /asr/status has sent timestamps with no offset
// ("2026-09-16T08:16:10") that are UTC. new Date() reads those as the viewer's
// local time, which put an 08:16 UTC run at 14:16. A time without Z or an
// offset is therefore taken as UTC; one that carries its zone passes through.
export function parseUtc(value?: string | null): Date | null {
  if (!value) return null
  const naive = value.includes("T") && !/(Z|[+-]\d{2}:?\d{2})$/i.test(value)
  const date = new Date(naive ? `${value}Z` : value)
  return isNaN(date.getTime()) ? null : date
}

// Report dates are YouTube's and the schedule is UTC, so render them in UTC
// rather than the viewer's zone — otherwise the same instant reads as two
// different days between a card and the timeline below it.
export function formatUtc(value?: string | null): string {
  const date = parseUtc(value)
  if (!date) return "—"
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

// Of the videos resolved so far, how many yielded a language. A video with no
// usable auto-caption track is a resolved answer too, cached so it is never
// looked up again — it covers no ASR track, captions forbidden, and video gone,
// so it is "none usable", never "no captions".
export function audioLanguageBreakdown(collector?: CollectorStatus | null) {
  const cache = collector?.cache
  if (!cache || cache.videos == null) return null
  return {
    videos: cache.videos,
    withTrack: cache.with_track ?? 0,
    noTrack: cache.no_track ?? 0,
  }
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
  }
}

// "es" reads as a guess to most people; "Spanish" does not. Falls back to the
// code for anything the runtime cannot name.
function languageName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code
  } catch {
    return code
  }
}

// The languages found so far, most videos first. Null until YT-Validator
// reports per-language counts, so the row simply doesn't appear before then.
export function topAudioLanguages(
  collector?: CollectorStatus | null,
  limit = 5
) {
  const counts = Object.entries(collector?.cache?.languages ?? {}).filter(
    // "" is "none usable", already its own figure on the cache row
    ([code, videos]) => code && videos > 0
  )
  if (!counts.length) return null
  counts.sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
  const all = counts.map(([code, videos]) => ({
    code,
    name: languageName(code),
    videos,
  }))
  return {
    all,
    top: all.slice(0, limit),
    more: Math.max(0, all.length - limit),
  }
}

const STOPPED_LABELS: Record<string, string> = {
  quota: "stopped: quota exhausted",
  outage: "stopped: YouTube unreachable",
}

// What the collector's last run did. A run that stopped early leaves more to
// do than its budget suggests, so `stopped` is what the tab makes stand out.
export function collectorLastRun(collector?: CollectorStatus | null) {
  const run = collector?.collector
  if (!run?.last_run) return null
  const reason = run.stopped_reason ?? null
  return {
    lastRun: run.last_run,
    lookedUp: run.looked_up ?? 0,
    added: run.added ?? 0,
    failed: run.failed ?? 0,
    stopped: reason !== null,
    stoppedLabel: reason
      ? (STOPPED_LABELS[reason] ?? `stopped: ${reason}`)
      : "not stopped",
    stoppedDetail: run.stopped_detail,
  }
}

// Each content owner's latest ingested snapshot. An ingest only fetches owners
// whose report is new, so the latest run alone can leave an owner out: on a day
// only Matter 2 published, Matter Entertainment vanished from this tab.
// `current` is whether that snapshot came in with the latest run. Against a
// pipeline API that predates `owners`, falls back to the latest run's view.
export function ownerSnapshots(
  status: ClaimsIngestStatus | null
): Array<ClaimsOwnerSnapshot & { current: boolean }> {
  const last = status?.lastCompleted ?? null
  if (status?.owners?.length) {
    return status.owners.map((owner) => ({
      ...owner,
      // without the run's id we cannot tell, so do not claim staleness
      current: !last?._id || owner.ingestId === last._id,
    }))
  }
  return Object.entries(last?.reports ?? {}).map(([source, report]) => {
    const counts = last?.results?.claimsProcessed?.[source]
    return {
      source,
      snapshot: report.startTime.slice(0, 10),
      publishedAt: report.createTime,
      ingestedAt: last?.endedAt ?? null,
      new: counts?.new ?? null,
      total: counts?.total ?? null,
      ingestId: last?._id ?? null,
      current: true,
    }
  })
}

// Oldest and newest data date across owners. "Claims as of" has to hold for
// every owner, so a single newest date would overstate how fresh the rest are.
export function snapshotRange(owners: Array<{ snapshot: string | null }>) {
  const dates = owners
    .map((owner) => owner.snapshot)
    .filter((date): date is string => !!date)
    .sort()
  if (!dates.length) return null
  return { oldest: dates[0], newest: dates[dates.length - 1] }
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

const Step: FC<{
  label: string
  detail: string
  done: boolean
}> = ({ label, detail, done }) => (
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
  onOpenIngest,
}) => {
  const [status, setStatus] = useState<ClaimsIngestStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // a handful of languages answers "what is it finding"; the rest on request
  const [allLanguages, setAllLanguages] = useState(false)

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
  const breakdown = audioLanguageBreakdown(status?.collector)
  const collectorRun = collectorLastRun(status?.collector)
  const topLanguages = topAudioLanguages(status?.collector)
  const owners = ownerSnapshots(status)
  const range = snapshotRange(owners)
  const age = daysOld(range?.oldest)
  const ageLabel =
    age == null
      ? undefined
      : age === 0
        ? "today"
        : `${age} day${age === 1 ? "" : "s"} old`

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
              value={
                !range
                  ? "—"
                  : range.oldest === range.newest
                    ? range.oldest
                    : `${range.oldest} – ${range.newest}`
              }
              hint={
                range && range.oldest !== range.newest && ageLabel
                  ? `oldest ${ageLabel}`
                  : ageLabel
              }
            />
            {/* The latest run's own figures: adding each owner's latest would
                mix counts from different runs into one number. */}
            <Metric
              label="New claims"
              value={newClaims(last).toLocaleString()}
              hint={`of ${scannedClaims(last).toLocaleString()} scanned · ${formatUtc(last.startedAt)} run`}
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

            {/* The collector's own numbers, under the step they explain. No
                "~N more days" estimate: it ignores claims that keep arriving. */}
            {(collectorRun || breakdown || audio) && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-700 mb-1.5">
                  Audio language collector
                </p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                  {collectorRun && (
                    <>
                      <dt className="text-gray-500">last run</dt>
                      <dd className="text-gray-700">
                        {formatUtc(collectorRun.lastRun)} · looked up{" "}
                        {collectorRun.lookedUp.toLocaleString()} · added{" "}
                        {collectorRun.added.toLocaleString()} · failed{" "}
                        {collectorRun.failed.toLocaleString()} ·{" "}
                        <span
                          title={collectorRun.stoppedDetail}
                          className={
                            collectorRun.stopped
                              ? "inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium"
                              : ""
                          }
                        >
                          {collectorRun.stopped && (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {collectorRun.stoppedLabel}
                        </span>
                      </dd>
                    </>
                  )}
                  {breakdown && (
                    <>
                      <dt className="text-gray-500">cache</dt>
                      <dd className="text-gray-700">
                        {breakdown.videos.toLocaleString()} videos:{" "}
                        {breakdown.withTrack.toLocaleString()} with a language,{" "}
                        {breakdown.noTrack.toLocaleString()} none usable
                      </dd>
                    </>
                  )}
                  {topLanguages && (
                    <>
                      <dt className="text-gray-500">top languages</dt>
                      <dd className="text-gray-700">
                        {(allLanguages
                          ? topLanguages.all
                          : topLanguages.top
                        ).map((lang, index) => (
                          <span key={lang.code} title={lang.code}>
                            {index > 0 && " · "}
                            {lang.name} {lang.videos.toLocaleString()}
                          </span>
                        ))}
                        {topLanguages.more > 0 && (
                          <>
                            {" · "}
                            <button
                              type="button"
                              onClick={() => setAllLanguages((open) => !open)}
                              aria-expanded={allLanguages}
                              className="text-blue-600 hover:underline"
                            >
                              {allLanguages
                                ? "show fewer"
                                : `+${topLanguages.more} more`}
                            </button>
                          </>
                        )}
                      </dd>
                    </>
                  )}
                  {audio && (
                    <>
                      <dt className="text-gray-500">remaining</dt>
                      <dd className="text-gray-700">
                        {audio.remaining.toLocaleString()} of{" "}
                        {audio.total?.toLocaleString() ?? "—"}
                      </dd>
                    </>
                  )}
                </dl>
                {/* Say when, not "not live": the tab refreshes every minute,
                    but these figures only change when the collector runs. */}
                <p className="text-xs text-gray-400 mt-2">
                  Figures from the collector&apos;s run
                  {collectorRun ? ` at ${formatUtc(collectorRun.lastRun)}` : ""}
                  . They update after its next run, daily at{" "}
                  {COLLECTOR_TIME_UTC} UTC.
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              {owners.map((owner) => (
                <div
                  key={owner.source}
                  data-owner={owner.source}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm"
                >
                  <span className="text-gray-600">
                    {OWNER_LABELS[owner.source] ?? owner.source}
                    <span className="text-xs text-gray-400">
                      {" · "}
                      {owner.snapshot
                        ? `snapshot ${owner.snapshot}`
                        : "not ingested yet"}
                      {owner.snapshot &&
                        !owner.current &&
                        " · no newer report yet"}
                    </span>
                  </span>
                  {owner.new != null && owner.total != null && (
                    <span className="text-gray-900">
                      <span className="font-medium">
                        {owner.new.toLocaleString()}
                      </span>{" "}
                      <span className="text-gray-500">
                        new of {owner.total.toLocaleString()}
                      </span>
                    </span>
                  )}
                </div>
              ))}
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
            {status.recent.slice(0, 5).map((attempt, index) => {
              const key = attempt._id ?? `${attempt.startedAt}-${index}`
              const ingestId = attempt._id
              const row = (
                <>
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
                </>
              )

              // Older attempts predate the id being stored, so fall back to
              // plain text rather than a button that could not go anywhere.
              if (!onOpenIngest || !ingestId) {
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between text-sm"
                  >
                    {row}
                  </div>
                )
              }

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onOpenIngest(ingestId)}
                  title="Open in history"
                  className="w-full -mx-2 px-2 py-1 rounded-md flex items-center justify-between text-sm text-left hover:bg-gray-50 transition-colors"
                >
                  {row}
                </button>
              )
            })}
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
