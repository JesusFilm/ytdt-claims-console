import { useMemo, useRef, useState } from "react"

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
  // Entry to single out on arrival — a run or an ingest, ids do not collide.
  // Set when another tab sends the user here, or by a shared ?run= link.
  highlightId?: string | null
  onLoadMore?: () => void
  onRetry?: (runId: string) => void
  onDownload?: (runId: string) => void
  className?: string
}

export default function PipelineHistoryTab({
  runs,
  ingests = [],
  stats,
  hasMore = false,
  loadingMore = false,
  highlightId = null,
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

  const highlighted = highlightId

  const highlightKind: Filter | null = useMemo(() => {
    if (!highlighted) return null
    if (runs.some((r) => r.id === highlighted)) return "pipeline"
    if (ingests.some((i) => i.id === highlighted)) return "ingest"
    return null // older than the loaded page
  }, [highlighted, runs, ingests])

  // Widen a filter that would hide the entry we were sent to: arriving at a
  // list that looks unchanged reads as a broken link. Derived rather than
  // stored, so picking a filter by hand afterwards still wins.
  const [filterChosenFor, setFilterChosenFor] = useState<string | null>(null)
  const effectiveFilter: Filter =
    highlightKind &&
    filter !== "all" &&
    filter !== highlightKind &&
    filterChosenFor !== highlighted
      ? "all"
      : filter

  const chooseFilter = (next: Filter) => {
    setFilter(next)
    setFilterChosenFor(highlighted)
  }

  // Scroll from the ref callback rather than an effect: the card may only
  // appear on the render *after* the filter is widened, by which time an
  // effect keyed on the id has already run and would never fire again.
  const scrolledFor = useRef<string | null>(null)
  const scrollHere = (node: HTMLDivElement | null) => {
    if (!node || scrolledFor.current === highlighted) return
    scrolledFor.current = highlighted
    node.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  // Newest first across both kinds
  const items = useMemo(() => {
    const merged: Array<
      | { kind: "pipeline"; at: number; run: PipelineRun }
      | { kind: "ingest"; at: number; ingest: ClaimsIngestSummary }
    > = []
    if (effectiveFilter !== "ingest") {
      runs.forEach((run) =>
        merged.push({
          kind: "pipeline",
          at: new Date(run.startTime).getTime(),
          run,
        })
      )
    }
    if (effectiveFilter !== "pipeline") {
      ingests.forEach((ingest) =>
        merged.push({
          kind: "ingest",
          at: new Date(ingest.startTime).getTime(),
          ingest,
        })
      )
    }
    return merged.sort((a, b) => b.at - a.at)
  }, [runs, ingests, effectiveFilter])

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

      <div className="flex items-center gap-2">
        {filters.map((option) => (
          <button
            key={option.id}
            onClick={() => chooseFilter(option.id)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              effectiveFilter === option.id
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
          items.map((item) => {
            const id = item.kind === "pipeline" ? item.run.id : item.ingest.id
            const isHighlighted = id === highlighted
            return (
              <div
                key={`${item.kind}-${id}`}
                data-entry={`${item.kind}-${id}`}
                ref={isHighlighted ? scrollHere : undefined}
              >
                {item.kind === "pipeline" ? (
                  <RunCard
                    run={item.run}
                    highlighted={isHighlighted}
                    onRetry={onRetry}
                    onDownload={onDownload}
                    onViewDetails={setSelectedRun}
                    onDownloadInvalidMCIDs={downloadInvalidMCIDs}
                    onDownloadInvalidLanguageIDs={downloadInvalidLanguageIDs}
                  />
                ) : (
                  <IngestCard
                    ingest={item.ingest}
                    highlighted={isHighlighted}
                  />
                )}
              </div>
            )
          })
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
