import { FC } from "react"

import {
  CheckCircle,
  Clock,
  Loader2,
  Database,
  Upload as UploadIcon,
  Cpu,
  Cloud,
  Circle,
  MinusCircle,
  XCircle,
} from "lucide-react"

import { formatDuration } from "@/utils/formatTime"

export interface PipelineStep {
  id: string
  name: string
  description?: string
  status:
    | "pending"
    | "running"
    | "completed"
    | "error"
    | "skipped"
    | "stopped"
    | "timeout"
    | "failed"
  startTime?: Date
  endTime?: Date
  duration?: number
  error?: string
}

interface PipelineStepsProps {
  steps: PipelineStep[]
  showDescriptions?: boolean
  compact?: boolean
  className?: string
}

const getStepIcon = (stepId: string) => {
  // Match by keyword in step name, not exact ID
  if (stepId.includes("vpn")) return <Cloud className="w-4 h-4" />
  if (stepId.includes("backup")) return <Database className="w-4 h-4" />
  if (stepId.includes("claims")) return <UploadIcon className="w-4 h-4" />
  if (stepId.includes("verdicts")) return <CheckCircle className="w-4 h-4" />
  if (stepId.includes("export")) return <Database className="w-4 h-4" />
  if (stepId.includes("ml")) return <Cpu className="w-4 h-4" />
  if (stepId.includes("drive")) return <Cloud className="w-4 h-4" />

  return <Clock className="w-4 h-4" />
}

const StepStatusIcon: FC<{ step: PipelineStep; className?: string }> = ({
  step,
  className = "w-5 h-5",
}) => {
  switch (step.status) {
    case "completed":
      return <CheckCircle className={`${className} text-green-600`} />
    case "running":
      return <Loader2 className={`${className} text-blue-600 animate-spin`} />
    case "error":
    case "failed":
      return <XCircle className={`${className} text-red-600`} />
    case "stopped":
      return <MinusCircle className={`${className} text-gray-600`} />
    case "skipped":
      return <Circle className={`${className} text-gray-400`} />
    case "timeout":
      return <Clock className={`${className} text-orange-600`} />
    case "pending":
    default:
      return <Circle className={`${className} text-gray-300`} />
  }
}

const formatStepName = (stepId: string) => {
  return stepId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

export default function PipelineSteps({
  steps,
  showDescriptions = false,
  compact = false,
  className = "",
}: PipelineStepsProps) {
  // Safety check for undefined steps
  if (!steps || steps.length === 0) {
    return (
      <div
        className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Pipeline Steps
          </h3>
        </div>
        <div className="px-6 py-4 text-center text-gray-500">
          No steps available
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Pipeline Steps</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`px-6 hover:bg-gray-50 transition-colors ${
              compact ? "py-3" : "py-4"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                {getStepIcon(step.id)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-gray-900">
                    {step.name || formatStepName(step.id)}
                  </h4>
                </div>
                {showDescriptions && step.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {step.description}
                  </p>
                )}
                {step.error && (
                  <p className="text-sm text-red-600 mt-1">{step.error}</p>
                )}
                {step.duration && (
                  <p className="text-xs text-gray-400 mt-1">
                    Duration: {formatDuration(step.duration)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500">Step {index + 1}</div>
                <StepStatusIcon step={step} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
