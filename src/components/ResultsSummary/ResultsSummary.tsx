import type { FC } from "react"

import {
  CheckCircle,
  AlertCircle,
  FileText,
  Database,
  Download,
  Scissors,
} from "lucide-react"

import type { PipelineRun } from "@/types/PipelineRun"
import { authFetch } from "@/utils/auth"

interface ResultsSummaryProps {
  results: PipelineRun["results"]
  runId: string
  className?: string
  onDownloadInvalidMCIDs?: (
    runId: string,
    type: "mcn" | "jfm" | "matter_entertainment" | "matter_2"
  ) => void
  onDownloadInvalidLanguageIDs?: (
    runId: string,
    type: "mcn" | "jfm" | "matter_entertainment" | "matter_2"
  ) => void
}

// "27 invalid MCIDs · 1,247 rows" — fixing an id corrects every row carrying
// it, so the id count is the work and the row count is the reach. Counted from
// the rows the run stored rather than from the pipeline's own summary, so runs
// recorded before the pipeline reported one read correctly too.
type Row = Record<string, string | number>

const distinctIds = (rows: Row[] = [], column: string) =>
  new Set(rows.map((row) => String(row[column] ?? ""))).size

function issueLabel(noun: string, column: string, rows: Row[] = []) {
  return (
    `${distinctIds(rows, column).toLocaleString()} invalid ${noun} · ` +
    `${rows.length.toLocaleString()} row${rows.length === 1 ? "" : "s"}`
  )
}

const MCID = "media_component_id"
const LANG = "language_id"

// The backlog: everything in the claims table that still has a bad id,
// whoever loaded it and whenever. Separate from the panel above on purpose —
// that one is about the file just sent, this one is the work left over.
const Backlog: FC<{
  results: NonNullable<PipelineRun["results"]>
  runId: string
}> = ({ results, runId }) => {
  const total = (key: "invalidMCIDs" | "invalidLanguageIDs") =>
    (results.mcnVerdicts?.acrossAllClaims?.[key] ?? 0) +
    (results.jfmVerdicts?.acrossAllClaims?.[key] ?? 0)

  const files = (key: "invalidMCIDs" | "invalidLanguageIDs") =>
    [
      results.mcnVerdicts?.acrossAllClaims?.files?.[key],
      results.jfmVerdicts?.acrossAllClaims?.files?.[key],
    ].filter((name): name is string => Boolean(name))

  const mcids = total("invalidMCIDs")
  const languages = total("invalidLanguageIDs")
  if (!mcids && !languages) return null

  const download = async (name: string) => {
    try {
      const response = await authFetch(`/api/exports/run/${runId}/${name}`)
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement("a")
      link.href = url
      link.download = name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const row = (
    label: string,
    rows: number,
    key: "invalidMCIDs" | "invalidLanguageIDs"
  ) =>
    rows > 0 && (
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-gray-700">
          {rows.toLocaleString()} row{rows === 1 ? "" : "s"} with {label}
        </span>
        <span className="flex gap-2">
          {files(key).map((name) => (
            <button
              key={name}
              onClick={() => download(name)}
              className="flex items-center gap-1.5 px-2 py-1 text-gray-700 bg-white hover:bg-gray-100 rounded border border-gray-200 transition-colors"
            >
              <Download className="w-3 h-3" />
              {name.includes("-jfm") ? "JFM" : "MCN"}
            </button>
          ))}
        </span>
      </div>
    )

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full">
      <div className="flex items-center gap-2 mb-1">
        <Database className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          In all claims so far
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Bad ids still sitting in the claims table, from every file ever loaded —
        not just this run.
      </p>
      <div className="space-y-2">
        {row("an invalid MCID", mcids, "invalidMCIDs")}
        {row("an invalid language id", languages, "invalidLanguageIDs")}
      </div>
    </div>
  )
}

export default function ResultsSummary({
  results,
  runId,
  className = "",
  onDownloadInvalidMCIDs,
  onDownloadInvalidLanguageIDs,
}: ResultsSummaryProps) {
  if (!results) return null

  const getTotalInvalidMCIDs = () =>
    distinctIds(results.mcnVerdicts?.invalidMCIDs, MCID) +
    distinctIds(results.jfmVerdicts?.invalidMCIDs, MCID) +
    distinctIds(
      results.claimsProcessed?.matter_entertainment?.invalidMCIDs,
      MCID
    ) +
    distinctIds(results.claimsProcessed?.matter_2?.invalidMCIDs, MCID)

  const getTotalInvalidLanguageIDs = () =>
    distinctIds(results.mcnVerdicts?.invalidLanguageIDs, LANG) +
    distinctIds(results.jfmVerdicts?.invalidLanguageIDs, LANG) +
    distinctIds(
      results.claimsProcessed?.matter_entertainment?.invalidLanguageIDs,
      LANG
    ) +
    distinctIds(results.claimsProcessed?.matter_2?.invalidLanguageIDs, LANG)

  const getTotalIssues = () => {
    return getTotalInvalidMCIDs() + getTotalInvalidLanguageIDs()
  }

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {results.claimsProcessed && (
        <div className="bg-white rounded-lg p-3 border border-gray-200 flex-1 min-w-[140px]">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Claims</span>
          </div>
          {(() => {
            const me = results.claimsProcessed.matter_entertainment
            const m2 = results.claimsProcessed.matter_2
            const totalNew = (me?.new || 0) + (m2?.new || 0)
            const totalAll = (me?.total || 0) + (m2?.total || 0)

            return (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">
                    {totalNew.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500">new</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">
                    {totalAll.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500">total</span>
                </div>
                {me && m2 && (
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <div>ME: {me.new.toLocaleString()} new</div>
                    <div>M2: {m2.new.toLocaleString()} new</div>
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* Verdicts */}
      {(results.mcnVerdicts || results.jfmVerdicts) && (
        <div className="bg-white rounded-lg p-3 border border-gray-200 flex-1 min-w-[140px]">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Verdicts</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              {(
                (results.mcnVerdicts?.processed || 0) +
                (results.jfmVerdicts?.processed || 0)
              ).toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">processed</span>
          </div>
        </div>
      )}

      {/* Shorts */}
      {results.enrichShorts && (
        <div className="bg-white rounded-lg p-3 border border-gray-200 flex-1 min-w-[140px]">
          <div className="flex items-center gap-2 mb-2">
            <Scissors className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Shorts</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              {results.enrichShorts.marked.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">flagged</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              {results.enrichShorts.checked.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">checked</span>
          </div>
        </div>
      )}

      {/* Exports */}
      <div className="bg-white rounded-lg p-3 border border-gray-200 flex-1 min-w-[140px]">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-600">Exports</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Local CSVs</span>
            <span className="font-medium text-gray-900">
              {(() => {
                let count = 0
                if (results.claimsProcessed) count++
                if (results.mcnVerdicts || results.jfmVerdicts) count++
                if (results.mlEnrichment?.status === "completed") count++
                return count
              })()}{" "}
              files
            </span>
          </div>

          {results.driveFolderUrl && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Google Drive</span>
              {results.mlEnrichment?.driveUploadError ? (
                <span
                  className="font-medium text-orange-600"
                  title={results.mlEnrichment.driveUploadError}
                >
                  ML file not synced
                </span>
              ) : (
                <span className="font-medium text-green-600">Synced</span>
              )}
            </div>
          )}
        </div>
      </div>

      <Backlog results={results} runId={runId} />

      {getTotalIssues() > 0 && (
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 w-full">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-600">
              Issues ({getTotalIssues().toLocaleString()})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* MCN Verdicts - invalid MCIDs */}
            {onDownloadInvalidMCIDs &&
              results.mcnVerdicts?.invalidMCIDs &&
              results.mcnVerdicts.invalidMCIDs.length > 0 && (
                <button
                  onClick={() => onDownloadInvalidMCIDs(runId, "mcn")}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                >
                  <Download className="w-3 h-3 flex-shrink-0" />
                  <span className="text-left">
                    <div className="font-medium">MCN Verdicts</div>
                    <div className="text-orange-600">
                      {issueLabel(
                        "MCIDs",
                        MCID,
                        results.mcnVerdicts.invalidMCIDs
                      )}
                    </div>
                  </span>
                </button>
              )}

            {/* JFM Verdicts - invalid MCIDs */}
            {onDownloadInvalidMCIDs &&
              results.jfmVerdicts?.invalidMCIDs &&
              results.jfmVerdicts.invalidMCIDs.length > 0 && (
                <button
                  onClick={() => onDownloadInvalidMCIDs(runId, "jfm")}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                >
                  <Download className="w-3 h-3 flex-shrink-0" />
                  <span className="text-left">
                    <div className="font-medium">JFM Verdicts</div>
                    <div className="text-orange-600">
                      {issueLabel(
                        "MCIDs",
                        MCID,
                        results.jfmVerdicts.invalidMCIDs
                      )}
                    </div>
                  </span>
                </button>
              )}

            {/* Matter Entertainment Claims - invalid MCIDs */}
            {onDownloadInvalidMCIDs &&
              results.claimsProcessed?.matter_entertainment?.invalidMCIDs &&
              results.claimsProcessed.matter_entertainment.invalidMCIDs.length >
                0 && (
                <button
                  onClick={() =>
                    onDownloadInvalidMCIDs(runId, "matter_entertainment")
                  }
                  className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                >
                  <Download className="w-3 h-3 flex-shrink-0" />
                  <span className="text-left">
                    <div className="font-medium">ME Claims</div>
                    <div className="text-orange-600">
                      {issueLabel(
                        "MCIDs",
                        MCID,
                        results.claimsProcessed.matter_entertainment
                          .invalidMCIDs
                      )}
                    </div>
                  </span>
                </button>
              )}

            {/* Matter 2 Claims - invalid MCIDs */}
            {onDownloadInvalidMCIDs &&
              results.claimsProcessed?.matter_2?.invalidMCIDs &&
              results.claimsProcessed.matter_2.invalidMCIDs.length > 0 && (
                <button
                  onClick={() => onDownloadInvalidMCIDs(runId, "matter_2")}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                >
                  <Download className="w-3 h-3 flex-shrink-0" />
                  <span className="text-left">
                    <div className="font-medium">M2 Claims</div>
                    <div className="text-orange-600">
                      {issueLabel(
                        "MCIDs",
                        MCID,
                        results.claimsProcessed.matter_2.invalidMCIDs
                      )}
                    </div>
                  </span>
                </button>
              )}

            {/* MCN Verdicts - invalid Language IDs */}
            {onDownloadInvalidLanguageIDs &&
              results.mcnVerdicts?.invalidLanguageIDs &&
              results.mcnVerdicts.invalidLanguageIDs.length > 0 && (
                <button
                  onClick={() => onDownloadInvalidLanguageIDs(runId, "mcn")}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                >
                  <Download className="w-3 h-3 flex-shrink-0" />
                  <span className="text-left">
                    <div className="font-medium">MCN Verdicts</div>
                    <div className="text-orange-600">
                      {issueLabel(
                        "Lang IDs",
                        LANG,
                        results.mcnVerdicts.invalidLanguageIDs
                      )}
                    </div>
                  </span>
                </button>
              )}

            {/* JFM Verdicts - invalid Language IDs */}
            {onDownloadInvalidLanguageIDs &&
              results.jfmVerdicts?.invalidLanguageIDs &&
              results.jfmVerdicts.invalidLanguageIDs.length > 0 && (
                <button
                  onClick={() => onDownloadInvalidLanguageIDs(runId, "jfm")}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                >
                  <Download className="w-3 h-3 flex-shrink-0" />
                  <span className="text-left">
                    <div className="font-medium">JFM Verdicts</div>
                    <div className="text-orange-600">
                      {issueLabel(
                        "Lang IDs",
                        LANG,
                        results.jfmVerdicts.invalidLanguageIDs
                      )}
                    </div>
                  </span>
                </button>
              )}

            {/* Matter Entertainment Claims - invalid Language IDs */}
            {onDownloadInvalidLanguageIDs &&
              results.claimsProcessed?.matter_entertainment
                ?.invalidLanguageIDs &&
              results.claimsProcessed.matter_entertainment.invalidLanguageIDs
                .length > 0 && (
                <button
                  onClick={() =>
                    onDownloadInvalidLanguageIDs(runId, "matter_entertainment")
                  }
                  className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                >
                  <Download className="w-3 h-3 flex-shrink-0" />
                  <span className="text-left">
                    <div className="font-medium">ME Claims</div>
                    <div className="text-orange-600">
                      {issueLabel(
                        "Lang IDs",
                        LANG,
                        results.claimsProcessed.matter_entertainment
                          .invalidLanguageIDs
                      )}
                    </div>
                  </span>
                </button>
              )}

            {/* Matter 2 Claims - invalid Language IDs */}
            {onDownloadInvalidLanguageIDs &&
              results.claimsProcessed?.matter_2?.invalidLanguageIDs &&
              results.claimsProcessed.matter_2.invalidLanguageIDs.length >
                0 && (
                <button
                  onClick={() =>
                    onDownloadInvalidLanguageIDs(runId, "matter_2")
                  }
                  className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                >
                  <Download className="w-3 h-3 flex-shrink-0" />
                  <span className="text-left">
                    <div className="font-medium">M2 Claims</div>
                    <div className="text-orange-600">
                      {issueLabel(
                        "Lang IDs",
                        LANG,
                        results.claimsProcessed.matter_2.invalidLanguageIDs
                      )}
                    </div>
                  </span>
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  )
}
