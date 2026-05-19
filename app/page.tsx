"use client"

import { useState, useCallback, useEffect } from "react"

import { Activity, AlertTriangle } from "lucide-react"

import PipelineHistoryTab from "@/components/PipelineHistoryTab"
import PipelineStatusTab from "@/components/PipelineStatusTab"
import type { PipelineStep } from "@/components/PipelineSteps"
import UploadTab from "@/components/UploadTab"
import UserMenu from "@/components/UserMenu"
import type { PipelineRun } from "@/types/PipelineRun"
import { authFetch } from "@/utils/auth"
import { env } from "@/env"

interface FileState {
  claimsME: File | null
  claimsM2: File | null
  mcnVerdicts: File | null
  jfmVerdicts: File | null
}

interface PipelineStatusState {
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

interface SystemHealth {
  status: string
  uptime: number
  memory: { used: number; total: number }
  enrich_ml_status?: "healthy" | "unhealthy" | "disabled"
  version?: string
  branch?: string
  commit?: string
  enrich_ml_version?: string
  enrich_ml_branch?: string
  enrich_ml_commit?: string
}

export default function Home() {
  const [files, setFiles] = useState<FileState>({
    claimsME: null,
    claimsM2: null,
    mcnVerdicts: null,
    jfmVerdicts: null,
  })

  const [status, setStatus] = useState<PipelineStatusState>({
    running: false,
    status: "idle",
    error: null,
    steps: [],
  })

  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"upload" | "status" | "history">(
    "upload"
  )
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [hasNewRun, setHasNewRun] = useState(false)
  const [pendingRun, setPendingRun] = useState<{ uploadedAt: string } | null>(null)

  // Fetch pending run on mount
  useEffect(() => {
    authFetch('/api/pending-run')
      .then(r => r.json())
      .then(data => setPendingRun(data.pendingRun))
      .catch(() => { })
  }, [])

  // Fetch system health
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await authFetch(`/api/health`)
        const health = await response.json()
        setSystemHealth(health)
      } catch (error) {
        console.error("Health check failed:", error)
        setSystemHealth({
          status: "error",
          uptime: 0,
          memory: { used: 0, total: 0 },
        })
      }
    }

    fetchHealth()
    const interval = setInterval(fetchHealth, 30000) // Check every 30s
    return () => clearInterval(interval)
  }, [])

  // Fetch pipeline history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await authFetch(`/api/runs/history`)
        const data = await response.json()
        setPipelineRuns(data.runs || [])
      } catch (error) {
        console.error("Failed to fetch history:", error)
      }
    }

    fetchHistory()
  }, [status.status]) // Refresh when pipeline completes

  // Fetch status on mount and poll when running
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await authFetch(`/api/status`)
        const data = await response.json()

        // If pipeline just finished, fetch last run from history
        if (data.running === false && status.running === true) {
          const historyResponse = await authFetch(`/api/runs/history?limit=1`)
          const historyData = await historyResponse.json()
          const lastRun = historyData.runs?.[0]

          setStatus({
            ...data,
            lastRun: lastRun
              ? {
                startTime: new Date(lastRun.startTime),
                duration: lastRun.duration,
                status: lastRun.status,
                error: lastRun.error,
                results: lastRun.results,
              }
              : undefined,
          })

          // Mark new run available
          setHasNewRun(true)

          // Refresh full history
          setTimeout(() => {
            const fetchHistory = async () => {
              const fullHistoryResponse = await authFetch(`/api/runs/history`)
              const fullHistoryData = await fullHistoryResponse.json()
              setPipelineRuns(fullHistoryData.runs || [])
            }
            fetchHistory()
          }, 1000)

        } else {
          setStatus({
            ...data,
            lastRun: data.lastRun,
          })
        }

      } catch (error) {
        console.error("Status fetch error:", error)
      }
    }

    // Fetch immediately on mount or when running state changes
    fetchStatus()

    // Only set up polling if running, has a running step (e.g. restarted step), or last run isn't completed
    const hasRunningStep = status.steps?.some(s => s.status === 'running')
    const shouldPoll = status.running || hasRunningStep || (status.lastRun && status.lastRun.status !== 'completed')
    if (!shouldPoll) return

    const interval = setInterval(fetchStatus, 2000)
    return () => clearInterval(interval)
  }, [status.running, status.status, status.steps])

  // Scroll to run details if "run" query param is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const runId = params.get('run')
    if (runId && pipelineRuns.length > 0) {
      setActiveTab('history')
      setTimeout(() => {
        document.getElementById(`run-${runId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [pipelineRuns])

  const handleFileDrop = useCallback(
    (acceptedFiles: File[], fileType: keyof FileState) => {
      if (acceptedFiles.length > 0) {
        setFiles((prev) => ({
          ...prev,
          [fileType]: acceptedFiles[0],
        }))
      }
    },
    []
  )

  const handleFileRemove = useCallback((fileType: keyof FileState) => {
    setFiles((prev) => ({
      ...prev,
      [fileType]: null,
    }))
  }, [])

  const handleRunPipeline = async () => {
    const hasFiles =
      files.claimsME || files.claimsM2 || files.mcnVerdicts || files.jfmVerdicts
    if (!hasFiles) {
      alert("Please upload at least one file")
      return
    }

    setLoading(true)
    const formData = new FormData()

    if (files.claimsME) {
      formData.append("claims_matter_entertainment", files.claimsME)
    }
    if (files.claimsM2) {
      formData.append("claims_matter_2", files.claimsM2)
    }
    if (files.mcnVerdicts) {
      formData.append("mcn_verdicts", files.mcnVerdicts)
    }
    if (files.jfmVerdicts) {
      formData.append("jfm_verdicts", files.jfmVerdicts)
    }

    try {
      const response = await authFetch(`/api/run`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log("Pipeline started:", result)

      // Switch to status view and start polling
      setActiveTab("status")
      setStatus({ running: true, status: "starting", error: null, steps: [] })
    } catch (error) {
      console.error("Upload error:", error)
      if (error instanceof Error) {
        alert(`Failed to start pipeline: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFiles({
      claimsME: null,
      claimsM2: null,
      mcnVerdicts: null,
      jfmVerdicts: null,
    })
    setStatus({ running: false, status: "idle", error: null, steps: [] })
    setActiveTab("upload")
  }

  const handleSaveClaims = async () => {
    if (!files.claimsME && !files.claimsM2) {
      alert('Please upload at least one claims file')
      return
    }
    setLoading(true)
    const formData = new FormData()
    if (files.claimsME) formData.append('claims_matter_entertainment', files.claimsME)
    if (files.claimsM2) formData.append('claims_matter_2', files.claimsM2)
    try {
      const response = await authFetch('/api/pending-run', { method: 'POST', body: formData })
      if (!response.ok) throw new Error((await response.json()).error)
      setPendingRun({ uploadedAt: new Date().toISOString() })
      handleReset()
    } catch (err) {
      alert(`Failed to save claims: ${err instanceof Error ? err.message : err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClearPendingRun = async () => {
    if (!confirm('Clear staged claims?')) return
    await authFetch('/api/pending-run', { method: 'DELETE' })
    setPendingRun(null)
  }

  const handleRetry = async (runId: string) => {
    try {
      setLoading(true)

      // Start the retry
      const response = await authFetch(`/api/runs/${runId}/retry`, {
        method: "POST", // Change to POST since we're starting a pipeline
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log("Pipeline retry started:", result)

      // Switch to status view and start polling
      setActiveTab("status")
      setStatus({ running: true, status: "starting", error: null, steps: [] })
    } catch (error) {
      console.error("Retry error:", error)
      if (error instanceof Error) {
        alert(`Failed to retry pipeline: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async (runId: string) => {
    if (!confirm("Are you sure you want to stop the running pipeline?")) {
      return
    }

    try {
      setLoading(true)

      const response = await authFetch(`/api/runs/${runId}/stop`, {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log("Pipeline stopped:", result)

      // Immediately update status to show stopped state
      setStatus((prev) => ({
        ...prev,
        running: false,
        status: "stopped",
        error: "Pipeline stopped by user",
      }))
    } catch (error) {
      console.error("Stop error:", error)
      if (error instanceof Error) {
        alert(`Failed to stop pipeline: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (runId: string) => {
    try {
      const response = await authFetch(`/api/exports/run/${runId}`)
      const data = await response.json()

      for (const file of data.files) {
        const fileResponse = await authFetch(`/api/exports/run/${runId}/${file.name}`)
        const blob = await fileResponse.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } catch (error) {
      console.error("Download error:", error)
      alert("Download failed")
    }
  }

  // Manual refresh function - clears lastRun and shows ready state
  const handleStatusRefresh = async () => {
    try {
      const response = await authFetch(`/api/status`)
      const data = await response.json()
      setStatus({ ...data, lastRun: data.lastRun })
    } catch (error) {
      console.error("Manual refresh error:", error)
    }
  }

  const isRunning = status.running || loading

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                YouTube MCN Pipeline
              </h1>
              <p className="text-gray-600">
                Multi-Channel Network claims processing dashboard
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                {systemHealth?.status === "ok" ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600">System healthy</span>
                    {systemHealth?.enrich_ml_status === "disabled" && (
                      <span className="text-gray-500 ml-2">• ML disabled</span>
                    )}
                  </>
                ) : systemHealth?.status === "degraded" ? (
                  <>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-orange-600">System degraded</span>
                    {systemHealth?.enrich_ml_status === "unhealthy" && (
                      <span className="text-orange-600 ml-2">
                        • ML service down
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">System offline</span>
                  </>
                )}
              </div>

              <div className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                {/* <Settings className="w-5 h-5" /> */}
                <UserMenu />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("upload")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "upload"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Upload & Run
              </button>
              <button
                onClick={() => setActiveTab("status")}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "status"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Current Status
                  {status.running && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab("history")
                  setHasNewRun(false)
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                <div className="flex items-center gap-2">
                  History ({pipelineRuns.length})
                  {hasNewRun && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Upload Tab */}
        {activeTab === "upload" && (
          <UploadTab
            files={files}
            isRunning={isRunning}
            loading={loading}
            pendingRun={pendingRun}
            handleFileDrop={handleFileDrop}
            handleFileRemove={handleFileRemove}
            handleRunPipeline={handleRunPipeline}
            handleSaveClaims={handleSaveClaims}
            handleClearPendingRun={handleClearPendingRun}
            handleReset={handleReset}
          />
        )}

        {/* Status Tab */}
        {activeTab === "status" && (
          <PipelineStatusTab
            status={status}
            onRefresh={handleStatusRefresh}
            onStop={handleStop}
          />
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <PipelineHistoryTab
            runs={pipelineRuns}
            onRetry={handleRetry}
            onDownload={handleDownload}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 bg-white border-t border-gray-100 py-2 text-center text-xs text-gray-400">
        v{process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0'} (console)
        {systemHealth?.branch && systemHealth?.commit && (
          <> · backend: {systemHealth.branch}@{systemHealth.commit}</>
        )}
        {systemHealth?.enrich_ml_branch && systemHealth?.enrich_ml_commit && (
          <> · yt-validator: {systemHealth.enrich_ml_branch}@{systemHealth.enrich_ml_commit}</>
        )}
      </footer>

    </div>
  )
}
