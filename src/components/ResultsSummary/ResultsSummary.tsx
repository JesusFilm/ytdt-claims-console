import {
  CheckCircle,
  AlertCircle,
  FileText,
  Database,
  Download,
} from "lucide-react"

import type { PipelineRun } from "@/types/PipelineRun"

interface ResultsSummaryProps {
  results: PipelineRun["results"]
  runId: string
  className?: string
  onDownloadInvalidMCIDs?: (runId: string, type: "mcn" | "jfm" | "matter_entertainment" | "matter_2") => void
  onDownloadInvalidLanguageIDs?: (runId: string, type: "mcn" | "jfm" | "matter_entertainment" | "matter_2") => void
}

export default function ResultsSummary({
  results,
  runId,
  className = "",
  onDownloadInvalidMCIDs,
  onDownloadInvalidLanguageIDs,
}: ResultsSummaryProps) {
  if (!results) return null

  const getTotalInvalidMCIDs = () => {
    const mcnCount = results.mcnVerdicts?.invalidMCIDs?.length || 0
    const jfmCount = results.jfmVerdicts?.invalidMCIDs?.length || 0
    const meCount = results.claimsProcessed?.matter_entertainment?.invalidMCIDs?.length || 0
    const m2Count = results.claimsProcessed?.matter_2?.invalidMCIDs?.length || 0
    return mcnCount + jfmCount + meCount + m2Count
  }

  const getTotalInvalidLanguageIDs = () => {
    const mcnCount = results.mcnVerdicts?.invalidLanguageIDs?.length || 0
    const jfmCount = results.jfmVerdicts?.invalidLanguageIDs?.length || 0
    const meCount = results.claimsProcessed?.matter_entertainment?.invalidLanguageIDs?.length || 0
    const m2Count = results.claimsProcessed?.matter_2?.invalidLanguageIDs?.length || 0
    return mcnCount + jfmCount + meCount + m2Count
  }

  const getTotalIssues = () => {
    return getTotalInvalidMCIDs() + getTotalInvalidLanguageIDs()
  }

  const handleDownloadMCIDs = () => {
    if (!onDownloadInvalidMCIDs) return

    if (results.mcnVerdicts?.invalidMCIDs?.length) {
      onDownloadInvalidMCIDs(runId, "mcn")
    } else if (results.jfmVerdicts?.invalidMCIDs?.length) {
      onDownloadInvalidMCIDs(runId, "jfm")
    } else if (results.claimsProcessed?.matter_entertainment?.invalidMCIDs?.length) {
      onDownloadInvalidMCIDs(runId, "matter_entertainment")
    } else if (results.claimsProcessed?.matter_2?.invalidMCIDs?.length) {
      onDownloadInvalidMCIDs(runId, "matter_2")
    }
  }

  const handleDownloadLanguageIDs = () => {
    if (!onDownloadInvalidLanguageIDs) return

    if (results.mcnVerdicts?.invalidLanguageIDs?.length) {
      onDownloadInvalidLanguageIDs(runId, "mcn")
    } else if (results.jfmVerdicts?.invalidLanguageIDs?.length) {
      onDownloadInvalidLanguageIDs(runId, "jfm")
    } else if (results.claimsProcessed?.matter_entertainment?.invalidLanguageIDs?.length) {
      onDownloadInvalidLanguageIDs(runId, "matter_entertainment")
    } else if (results.claimsProcessed?.matter_2?.invalidLanguageIDs?.length) {
      onDownloadInvalidLanguageIDs(runId, "matter_2")
    }
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
      {results.claimsProcessed && (
        <div className="bg-white rounded-lg p-3 border border-gray-200">
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

      {(results.mcnVerdicts || results.jfmVerdicts) && (
        <div className="bg-white rounded-lg p-3 border border-gray-200">
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

      {results.exports && (
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-600">Exports</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              {Object.keys(results.exports).length}
            </span>
            <span className="text-xs text-gray-500">files</span>
          </div>
        </div>
      )}

      {getTotalIssues() > 0 && (
        <div className="bg-white rounded-lg p-3 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-orange-600">Issues</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-orange-600">
              {getTotalIssues()}
            </span>
            <div className="flex flex-col gap-1">
              {onDownloadInvalidMCIDs && getTotalInvalidMCIDs() > 0 && (
                <button
                  onClick={handleDownloadMCIDs}
                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                >
                  <Download className="w-3 h-3" />
                  invalid MCIDs
                </button>
              )}
              {onDownloadInvalidLanguageIDs &&
                getTotalInvalidLanguageIDs() > 0 && (
                  <button
                    onClick={handleDownloadLanguageIDs}
                    className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 hover:underline transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    invalid Lang IDs
                  </button>
                )}
              <span className="text-xs text-orange-500">
                {getTotalInvalidMCIDs() > 0 &&
                  `${getTotalInvalidMCIDs()} MCIDs`}
                {getTotalInvalidMCIDs() > 0 &&
                  getTotalInvalidLanguageIDs() > 0 &&
                  ", "}
                {getTotalInvalidLanguageIDs() > 0 &&
                  `${getTotalInvalidLanguageIDs()} Lang IDs`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
