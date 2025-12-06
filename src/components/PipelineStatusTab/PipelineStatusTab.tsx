import { FC, useState } from "react"

import { CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react"

import PipelineSteps, { PipelineStep } from "@/components/PipelineSteps"
import RefreshButton from "@/components/RefreshButton"
import { PipelineRun } from "@/types/PipelineRun"
import { formatDuration } from "@/utils/formatTime"
import { authFetch } from "@/utils/auth"

export interface PipelineStatusProps {
  status: {
    runId?: string
    running: boolean
    status: string
    error: string | null
    progress?: number
    steps: PipelineStep[]
    currentStep?: string
    startTime?: Date
    lastRun?: PipelineRun
  }
  onRefresh?: () => Promise<void>
  onStop?: (runId: string) => Promise<void>
}

const StatusBadge: FC<{ status: string; running: boolean }> = ({
  status,
  running,
}) => {
  if (running) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        Processing
      </div>
    )
  }

  if (status === "completed") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
        <CheckCircle className="w-4 h-4" />
        Completed
      </div>
    )
  }

  if (status === "failed") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
        <AlertCircle className="w-4 h-4" />
        Failed
      </div>
    )
  }

  if (status === "timeout") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
        <Clock className="w-4 h-4" />
        Timed Out
      </div>
    )
  }

  if (status === "stopped") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
        <XCircle className="w-4 h-4" />
        Stopped
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
      <Clock className="w-4 h-4" />
      Idle
    </div>
  )
}

export default function PipelineStatusTab({
  status,
  onRefresh,
  onStop,
}: PipelineStatusProps) {
  
  const [restartingStepId, setRestartingStepId] = useState<string | null>(null)
  const showIdleState = !status.running

  const handleRestartStep = async (stepId: string) => {
    // Use status.runId instead of status.lastRun?.id
    if (!status.runId) return

    try {
      setRestartingStepId(stepId)

      const response = await authFetch(
        `/api/runs/${status.runId}/steps/${stepId}/restart`,  // Changed here
        { method: 'POST' }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      console.log('Step restart initiated:', await response.json())

      // Refresh status
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error: any) {
      console.error('Restart step error:', error)
      alert(`Failed to restart step: ${error.message}`)
    } finally {
      setRestartingStepId(null)
    }
  }

  const getProgress = () => {
    if (status.progress !== undefined) return status.progress
    if (!status.steps) return 0
    const completed = status.steps.filter(
      (s) => s.status === "completed"
    ).length
    return (completed / status.steps.length) * 100
  }

  const getCurrentStepInfo = () => {
    if (!status.running || !status.steps) return null
    const runningStep = status.steps.find((s) => s.status === "running")
    const completedCount = status.steps.filter(
      (s) => s.status === "completed"
    ).length

    return {
      current: runningStep?.name || status.currentStep,
      step: completedCount + 1,
      total: status.steps.length,
    }
  }

  const currentStep = getCurrentStepInfo()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pipeline Status</h2>
          <p className="text-gray-600 mt-1">
            {status.running
              ? "Monitor the current pipeline execution"
              : "View pipeline status and recent activity"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status.status} running={status.running} />
          {onRefresh && <RefreshButton {...{ onRefresh }} />}
          {status.running && status.runId && onStop && (
            <button
              onClick={() => onStop(status.runId!)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Stop Pipeline
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar - Only show when running */}
      {status.running && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">
                {currentStep
                  ? `Step ${currentStep.step} of ${currentStep.total}`
                  : "Processing"}
              </h3>
              <p className="text-blue-700 text-sm mt-1">
                {currentStep?.current || "Pipeline in progress..."}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">
                {Math.round(getProgress())}%
              </div>
              <div className="text-xs text-blue-600">
                {getProgress() === 100 ? "Complete" : "In Progress"}
              </div>
            </div>
          </div>

          <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgress()}%` }}
            />
          </div>

          {status.startTime && (
            <div className="mt-3 text-xs text-blue-600">
              Started: {new Date(status.startTime).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {status.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Pipeline Failed</h3>
              <p className="text-red-700 mt-1">{status.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Idle State - Show Last Run Status */}
      {showIdleState && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          {status.lastRun ? (
            <div>
              {status.lastRun.status === "completed" ? (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Last Run Completed
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Finished{" "}
                      {new Date(status.lastRun.startTime).toLocaleString()} •
                      Duration: {formatDuration(status.lastRun.duration)}
                      {status.lastRun.id && (
                        <span className="text-gray-400 ml-2">
                          • ID: {status.lastRun.id}
                        </span>
                      )}
                    </p>

                    {status.lastRun.results && (
                      <div className="mt-3 text-sm text-gray-700">
                        {(status.lastRun.results.claimsProcessed
                          ?.matter_entertainment?.new ||
                          status.lastRun.results.claimsProcessed?.matter_2
                            ?.new) && (
                            <span>
                              {(status.lastRun.results.claimsProcessed
                                ?.matter_entertainment?.new ?? 0) +
                                (status.lastRun.results.claimsProcessed?.matter_2
                                  ?.new ?? 0)}{" "}
                              new claims processed
                            </span>
                          )}
                        {status.lastRun.results.exports &&
                          status.lastRun.results.claimsProcessed && (
                            <span> • </span>
                          )}
                        {status.lastRun.results.exports && (
                          <span>
                            {Object.keys(status.lastRun.results.exports).length}{" "}
                            files exported
                          </span>
                        )}
                        {status.lastRun.results.mcnVerdicts?.invalidMCIDs &&
                          status.lastRun.results.mcnVerdicts.invalidMCIDs
                            .length > 0 && (
                            <span className="text-orange-600">
                              {" "}
                              •{" "}
                              {
                                status.lastRun.results.mcnVerdicts.invalidMCIDs
                                  .length
                              }{" "}
                              invalid MCIDs
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Pipeline Available
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Last run {status.lastRun.status} at{" "}
                      {new Date(status.lastRun.startTime).toLocaleString()}
                    </p>

                    {status.lastRun.error && (
                      <p className="text-orange-700 text-sm mt-2">
                        {status.lastRun.error}
                      </p>
                    )}

                    <p className="text-gray-600 text-sm mt-3">
                      Ready to start new run or restart failed steps
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                System Ready
              </h3>
              <p className="text-gray-600">
                Pipeline is ready to process claims and verdicts
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pipeline Steps - Only show when running or when showing idle state */}
      {(status.running || showIdleState) && (
        <PipelineSteps
          steps={status.steps}
          showDescriptions={status.running}
          onRestartStep={handleRestartStep}
          restartingStepId={restartingStepId}
        />
      )}
    </div>
  )
}
