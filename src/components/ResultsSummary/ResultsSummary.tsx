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

      {/* Exports */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
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
                if (results.mlEnrichment?.status === 'completed') count++
                return count
              })()} files
            </span>
          </div>

          {results.driveFolderUrl && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Google Drive</span>
              <span className="font-medium text-green-600">Synced</span>
            </div>
          )}
        </div>
      </div>

      {getTotalIssues() > 0 && (
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-600">
              Issues ({getTotalIssues()})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* MCN Verdicts - invalid MCIDs */}
            {onDownloadInvalidMCIDs && results.mcnVerdicts?.invalidMCIDs && results.mcnVerdicts.invalidMCIDs.length > 0 && (
              <button
                onClick={() => onDownloadInvalidMCIDs(runId, "mcn")}
                className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
              >
                <Download className="w-3 h-3 flex-shrink-0" />
                <span className="text-left">
                  <div className="font-medium">MCN Verdicts</div>
                  <div className="text-orange-600">{results.mcnVerdicts.invalidMCIDs.length} invalid MCIDs</div>
                </span>
              </button>
            )}

            {/* JFM Verdicts - invalid MCIDs */}
            {onDownloadInvalidMCIDs && results.jfmVerdicts?.invalidMCIDs && results.jfmVerdicts.invalidMCIDs.length > 0 && (
              <button
                onClick={() => onDownloadInvalidMCIDs(runId, "jfm")}
                className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
              >
                <Download className="w-3 h-3 flex-shrink-0" />
                <span className="text-left">
                  <div className="font-medium">JFM Verdicts</div>
                  <div className="text-orange-600">{results.jfmVerdicts.invalidMCIDs.length} invalid MCIDs</div>
                </span>
              </button>
            )}

            {/* Matter Entertainment Claims - invalid MCIDs */}
            {onDownloadInvalidMCIDs && results.claimsProcessed?.matter_entertainment?.invalidMCIDs && results.claimsProcessed.matter_entertainment.invalidMCIDs.length > 0 && (
              <button
                onClick={() => onDownloadInvalidMCIDs(runId, "matter_entertainment")}
                className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
              >
                <Download className="w-3 h-3 flex-shrink-0" />
                <span className="text-left">
                  <div className="font-medium">ME Claims</div>
                  <div className="text-orange-600">{results.claimsProcessed.matter_entertainment.invalidMCIDs.length} invalid MCIDs</div>
                </span>
              </button>
            )}

            {/* Matter 2 Claims - invalid MCIDs */}
            {onDownloadInvalidMCIDs && results.claimsProcessed?.matter_2?.invalidMCIDs && results.claimsProcessed.matter_2.invalidMCIDs.length > 0 && (
              <button
                onClick={() => onDownloadInvalidMCIDs(runId, "matter_2")}
                className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
              >
                <Download className="w-3 h-3 flex-shrink-0" />
                <span className="text-left">
                  <div className="font-medium">M2 Claims</div>
                  <div className="text-orange-600">{results.claimsProcessed.matter_2.invalidMCIDs.length} invalid MCIDs</div>
                </span>
              </button>
            )}

            {/* MCN Verdicts - invalid Language IDs */}
            {onDownloadInvalidLanguageIDs && results.mcnVerdicts?.invalidLanguageIDs && results.mcnVerdicts.invalidLanguageIDs.length > 0 && (
              <button
                onClick={() => onDownloadInvalidLanguageIDs(runId, "mcn")}
                className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
              >
                <Download className="w-3 h-3 flex-shrink-0" />
                <span className="text-left">
                  <div className="font-medium">MCN Verdicts</div>
                  <div className="text-orange-600">{results.mcnVerdicts.invalidLanguageIDs.length} invalid Lang IDs</div>
                </span>
              </button>
            )}

            {/* JFM Verdicts - invalid Language IDs */}
            {onDownloadInvalidLanguageIDs && results.jfmVerdicts?.invalidLanguageIDs && results.jfmVerdicts.invalidLanguageIDs.length > 0 && (
              <button
                onClick={() => onDownloadInvalidLanguageIDs(runId, "jfm")}
                className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
              >
                <Download className="w-3 h-3 flex-shrink-0" />
                <span className="text-left">
                  <div className="font-medium">JFM Verdicts</div>
                  <div className="text-orange-600">{results.jfmVerdicts.invalidLanguageIDs.length} invalid Lang IDs</div>
                </span>
              </button>
            )}

            {/* Matter Entertainment Claims - invalid Language IDs */}
            {onDownloadInvalidLanguageIDs && results.claimsProcessed?.matter_entertainment?.invalidLanguageIDs && results.claimsProcessed.matter_entertainment.invalidLanguageIDs.length > 0 && (
              <button
                onClick={() => onDownloadInvalidLanguageIDs(runId, "matter_entertainment")}
                className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
              >
                <Download className="w-3 h-3 flex-shrink-0" />
                <span className="text-left">
                  <div className="font-medium">ME Claims</div>
                  <div className="text-orange-600">{results.claimsProcessed.matter_entertainment.invalidLanguageIDs.length} invalid Lang IDs</div>
                </span>
              </button>
            )}

            {/* Matter 2 Claims - invalid Language IDs */}
            {onDownloadInvalidLanguageIDs && results.claimsProcessed?.matter_2?.invalidLanguageIDs && results.claimsProcessed.matter_2.invalidLanguageIDs.length > 0 && (
              <button
                onClick={() => onDownloadInvalidLanguageIDs(runId, "matter_2")}
                className="flex items-center gap-2 px-3 py-2 text-xs text-orange-700 bg-white hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
              >
                <Download className="w-3 h-3 flex-shrink-0" />
                <span className="text-left">
                  <div className="font-medium">M2 Claims</div>
                  <div className="text-orange-600">{results.claimsProcessed.matter_2.invalidLanguageIDs.length} invalid Lang IDs</div>
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}