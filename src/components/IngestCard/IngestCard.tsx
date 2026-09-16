import { FC } from "react"

import {
  AlertCircle,
  CheckCircle,
  Download,
  KeyRound,
  Minus,
} from "lucide-react"

import { formatUtc } from "@/components/ClaimsCollectionTab"
import type { ClaimsIngestSummary } from "@/types/ClaimsIngest"

const OWNER_LABELS: Record<string, string> = {
  matter_entertainment: "Matter Entertainment",
  matter_2: "Matter 2",
}

function newClaims(ingest: ClaimsIngestSummary): number {
  return Object.values(ingest.results?.claimsProcessed ?? {}).reduce(
    (sum, counts) => sum + (counts.new || 0),
    0
  )
}

// "nothing_new" is the common case, not a failure: YouTube publishes snapshots
// irregularly, so most days there is simply nothing newer to fetch.
const StatusPill: FC<{ ingest: ClaimsIngestSummary }> = ({ ingest }) => {
  if (ingest.status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        Collected
      </span>
    )
  }
  if (ingest.status === "nothing_new") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
        <Minus className="w-3.5 h-3.5" />
        No new snapshot
      </span>
    )
  }
  if (ingest.status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
        {ingest.authRequired ? (
          <KeyRound className="w-3.5 h-3.5" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5" />
        )}
        {ingest.authRequired ? "Sign-in expired" : "Failed"}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
      {ingest.status}
    </span>
  )
}

export interface IngestCardProps {
  ingest: ClaimsIngestSummary
  highlighted?: boolean
}

const IngestCard: FC<IngestCardProps> = ({ ingest, highlighted = false }) => {
  const snapshots = Object.values(ingest.reports ?? {}).map((r) =>
    r.startTime.slice(0, 10)
  )
  const snapshot = snapshots.sort().slice(-1)[0]
  const queued = ingest.results?.asrQueue?.rows

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 p-6 ${
        highlighted ? "ring-2 ring-blue-400" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-gray-900">
              {formatUtc(ingest.startTime)}
            </h3>
            <StatusPill ingest={ingest} />
            <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
              <Download className="w-3 h-3 mr-1" />
              Claims ingest
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {snapshot ? `Snapshot ${snapshot}` : "No report to collect"}
            {ingest.trigger === "manual" && " · run by hand"}
          </p>
        </div>
      </div>

      {ingest.status === "completed" && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">New claims</p>
            <p className="text-lg font-medium text-gray-900">
              {newClaims(ingest).toLocaleString()}
            </p>
            <div className="mt-1 space-y-0.5">
              {Object.entries(ingest.results?.claimsProcessed ?? {}).map(
                ([source, counts]) => (
                  <p key={source} className="text-xs text-gray-500">
                    {OWNER_LABELS[source] ?? source}:{" "}
                    {counts.new.toLocaleString()}
                  </p>
                )
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Queued for review</p>
            <p className="text-lg font-medium text-gray-900">
              {queued != null ? queued.toLocaleString() : "—"}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Shorts</p>
            <p className="text-lg font-medium text-gray-900">
              {ingest.results?.enrichShorts?.marked?.toLocaleString() ?? "—"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              of{" "}
              {ingest.results?.enrichShorts?.checked?.toLocaleString() ?? "—"}{" "}
              checked
            </p>
          </div>
        </div>
      )}

      {ingest.error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{ingest.error}</p>
        </div>
      )}

      {ingest.status === "skipped" && ingest.reason && (
        <p className="mt-3 text-sm text-gray-500">Skipped: {ingest.reason}</p>
      )}
    </div>
  )
}

export default IngestCard
