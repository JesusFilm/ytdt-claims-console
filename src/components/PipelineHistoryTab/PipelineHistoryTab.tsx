import { useMemo, useState } from "react"

import { CheckCircle, AlertCircle, Calendar, TrendingUp } from "lucide-react"

import IngestCard from "@/components/IngestCard"
import RunCard from "@/components/RunCard"
import RunDetailsModal from "@/components/RunDetailsModal"
import type { ClaimsIngestSummary, HistoryStats } from "@/types/ClaimsIngest"
import type { PipelineRun } from "@/types/PipelineRun"
import { formatDuration } from "@/utils/formatTime"

type Filter = "all" | "pipeline" | "ingest"

interface PipelineHistoryProps {
  runs: PipelineRun[]
  // Claims now arrive on a schedule, so history without ingests is incomplete
  ingests?: ClaimsIngestSummary[]
  stats?: HistoryStats
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  onRetry?: (runId: string) => void
  onDownload?: (runId: string) => void
  className?: string
}

const ISSUE_KEYS = ["invalidMCIDs", "invalidLanguageIDs"] as const

// Every invalid id a run reported, across claims and verdicts. Per-run these
// live in separate buckets; the count is what shows whether they are growing.
export function issueCount(run: PipelineRun): number {
  const results = run.results
  if (!results) return 0

  const buckets = [
    results.claimsProcessed?.matter_entertainment,
    results.claimsProcessed?.matter_2,
    results.mcnVerdicts,
    results.jfmVerdicts,
  ]
  return buckets.reduce((sum, bucket) => {
    if (!bucket) return sum
    return (
      sum +
      ISSUE_KEYS.reduce((inner, key) => {
        const entries = (bucket as Record<string, unknown>)[key] as
          | unknown[]
          | undefined
        return inner + (entries?.length ?? 0)
      }, 0)
    )
  }, 0)
}

export default function PipelineHistoryTab({
  runs,
  ingests = [],
  stats,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  onRetry,
  onDownload,
  className = "",
}: PipelineHistoryProps) {
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null)
  const [filter, setFilter] = useState<Filter>("all")

  const derived = useMemo(() => {
    const successful = runs.filter((r) => r.status === "completed").length
    const failed = runs.filter((r) => r.status === "failed").length
    const total = runs.length
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
    }
  }, [runs])

  const successRate =
    stats && stats.total > 0
      ? Math.round((stats.successful / stats.total) * 100)
      : derived.successRate

  // Per mode: one median across a 15-minute full run and a 3-minute scoring run
  // described neither. Falls back to whatever the client can see.
  const medianFull =
    stats?.medianDuration?.full ??
    (() => {
      const durations = runs
        .filter((r) => r.status === "completed" && r.duration)
        .map((r) => r.duration!)
        .sort((a, b) => a - b)
      if (!durations.length) return null
      return durations[Math.floor(durations.length / 2)]
    })()

  // Newest first across both kinds
  const items = useMemo(() => {
    const merged: Array<
      | { kind: "pipeline"; at: number; run: PipelineRun }
      | { kind: "ingest"; at: number; ingest: ClaimsIngestSummary }
    > = []
    if (filter !== "ingest") {
      runs.forEach((run) =>
        merged.push({
          kind: "pipeline",
          at: new Date(run.startTime).getTime(),
          run,
        })
      )
    }
    if (filter !== "pipeline") {
      ingests.forEach((ingest) =>
        merged.push({
          kind: "ingest",
          at: new Date(ingest.startedAt).getTime(),
          ingest,
        })
      )
    }
    return merged.sort((a, b) => b.at - a.at)
  }, [runs, ingests, filter])

  // Only worth showing as a trend: a single number says nothing about whether
  // invalid ids are growing.
  const issueTrend = useMemo(() => {
    const recent = runs
      .filter((r) => r.results)
      .slice(0, 5)
      .map((r) => issueCount(r))
      .reverse()
    return recent.some((count) => count > 0) ? recent : null
  }, [runs])

  const downloadInvalidMCIDs = (
    runId: string,
    type: "mcn" | "jfm" | "matter_entertainment" | "matter_2"
  ) => {
    const run = runs.find((r) => r.id === runId)
    if (!run?.results) return

    let invalidMCIDs: Array<Record<string, string | number>> | undefined
    if (type === "mcn") {
      invalidMCIDs = run.results.mcnVerdicts?.invalidMCIDs
    } else if (type === "jfm") {
      invalidMCIDs = run.results.jfmVerdicts?.invalidMCIDs
    } else if (type === "matter_entertainment") {
      invalidMCIDs =
        run.results.claimsProcessed?.matter_entertainment?.invalidMCIDs
    } else if (type === "matter_2") {
      invalidMCIDs = run.results.claimsProcessed?.matter_2?.invalidMCIDs
    }

    if (!invalidMCIDs?.length) return

    const csvContent = [
      "video_id,media_component_id,channel_id,wave,views",
      ...invalidMCIDs.map(
        (r) =>
          `${r.video_id},${r.media_component_id},${r.channel_id},${r.wave},${r.views}`
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `invalid-mcids-${type}-${runId}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadInvalidLanguageIDs = (
    runId: string,
    type: "mcn" | "jfm" | "matter_entertainment" | "matter_2"
  ) => {
    const run = runs.find((r) => r.id === runId)
    if (!run?.results) return

    let invalidLanguageIDs: Array<Record<string, string | number>> | undefined
    if (type === "mcn") {
      invalidLanguageIDs = run.results.mcnVerdicts?.invalidLanguageIDs
    } else if (type === "jfm") {
      invalidLanguageIDs = run.results.jfmVerdicts?.invalidLanguageIDs
    } else if (type === "matter_entertainment") {
      invalidLanguageIDs =
        run.results.claimsProcessed?.matter_entertainment?.invalidLanguageIDs
    } else if (type === "matter_2") {
      invalidLanguageIDs =
        run.results.claimsProcessed?.matter_2?.invalidLanguageIDs
    }

    if (!invalidLanguageIDs?.length) return

    const csvContent = [
      "video_id,language_id,channel_id",
      ...invalidLanguageIDs.map(
        (r) => `${r.video_id},${r.language_id},${r.channel_id}`
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `invalid-language-ids-${type}-${runId}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const highlightedRunId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("run")
      : null

  const filters: Array<{ id: Filter; label: string }> = [
    { id: "all", label: "All" },
    { id: "pipeline", label: `Pipeline runs (${runs.length})` },
    { id: "ingest", label: `Claims ingests (${ingests.length})` },
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pipeline History</h2>
          <p className="text-gray-600 mt-1">
            Pipeline runs and daily claims collection
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="font-semibold text-gray-900">
              {runs.length + ingests.length}
            </p>
            <p className="text-gray-500">Entries</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-green-600">{successRate}%</p>
            <p className="text-gray-500">Run success</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {stats?.successful ?? derived.successful}
              </p>
              <p className="text-sm text-gray-500">Successful runs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {stats?.failed ?? derived.failed}
              </p>
              <p className="text-sm text-gray-500">Failed runs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {medianFull != null ? formatDuration(medianFull) : "—"}
              </p>
              <p className="text-sm text-gray-500">Median full run</p>
            </div>
          </div>
        </div>
      </div>

      {issueTrend && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">
            Invalid ids reported, oldest to newest:{" "}
            <span className="text-gray-900">{issueTrend.join(" → ")}</span>
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {filters.map((option) => (
          <button
            key={option.id}
            onClick={() => setFilter(option.id)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              filter === option.id
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nothing here yet
            </h3>
            <p className="text-gray-600">
              Claims collection and pipeline runs will appear here
            </p>
          </div>
        ) : (
          items.map((item) =>
            item.kind === "pipeline" ? (
              <RunCard
                key={`run-${item.run.id}`}
                run={item.run}
                highlighted={item.run.id === highlightedRunId}
                onRetry={onRetry}
                onDownload={onDownload}
                onViewDetails={setSelectedRun}
                onDownloadInvalidMCIDs={downloadInvalidMCIDs}
                onDownloadInvalidLanguageIDs={downloadInvalidLanguageIDs}
              />
            ) : (
              <IngestCard
                key={`ingest-${item.ingest.id}`}
                ingest={item.ingest}
              />
            )
          )
        )}

        {hasMore && (
          <div className="text-center">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loadingMore ? "Loading…" : "Load older"}
            </button>
          </div>
        )}
      </div>

      {selectedRun && (
        <RunDetailsModal
          run={selectedRun}
          isOpen={!!selectedRun}
          onClose={() => setSelectedRun(null)}
        />
      )}
    </div>
  )
}
